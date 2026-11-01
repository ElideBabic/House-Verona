/* POST /api/rezervacija — gost šalje odabrane tjedne, podatke i način plaćanja.
   - kartica: dobiva poveznicu na Stripe. Iznos se na kartici samo rezervira
     (capture_method: manual); naplaćuje se tek kad vlasnica potvrdi u admin sučelju.
   - uplata na račun: zahtjev odmah čeka potvrdu vlasnice; nakon potvrde gost
     mailom dobiva podatke za uplatu. */

import { FieldValue } from "firebase-admin/firestore";
import { getStripe, json, SITE_URL, payMethods, sendMail, adminEmail } from "./_lib/servisi.js";
import { bookedWeeks, pendingWeeks, bookingsCol } from "./_lib/rezervacije.js";
import { guestMail, adminMail } from "./_lib/mailovi.js";
import { stayPrice, isBookableOnline, weekEnd, weekList, formatDate, MAX_GUESTS } from "../cijene.js";

const LANGS = ["hr", "en", "it", "de"];
const ERR = {
  invalid: "invalid",
  unavailable: "unavailable",
  notOnline: "not_online",
};

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request) {
  const methods = payMethods();
  if (!methods.card && !methods.bank) return json({ error: ERR.notOnline }, 409);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: ERR.invalid }, 400);
  }

  // Skriveno polje koje ljudi ne vide — popunjavaju ga samo botovi.
  if (body.website) return json({ error: ERR.invalid }, 400);

  const week = clean(body.week, 10);
  const lang = LANGS.includes(body.lang) ? body.lang : "en";
  const name = clean(body.name, 100);
  const email = clean(body.email, 200).toLowerCase();
  const phone = clean(body.phone, 40);
  const note = clean(body.note, 1000);
  const adults = body.adults == null ? null : Number(body.adults);
  const children = body.children == null ? 0 : Number(body.children);
  const guests = adults == null ? Number(body.guests) : adults + children;
  const weeks = body.weeks == null ? 1 : Number(body.weeks);
  // Stari obrazac ne šalje način plaćanja — tada je to kartica.
  const method = body.payment === "bank" ? "bank" : "card";

  if (
    !name ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !Number.isInteger(guests) ||
    guests < 1 ||
    guests > MAX_GUESTS ||
    (adults != null && (!Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0)) ||
    body.terms !== true
  ) {
    return json({ error: ERR.invalid }, 400);
  }
  if (!methods[method]) return json({ error: ERR.notOnline }, 409);

  let price = stayPrice(week, weeks);
  if (!price || !isBookableOnline(week)) return json({ error: ERR.notOnline }, 409);

  // Probno plaćanje: na testnoj (preview) objavi TEST_PRICE_EUR zamjenjuje iznos, npr. 5 €.
  // Na pravoj stranici (VERCEL_ENV=production) se nikad ne primjenjuje.
  const testPrice = Number(process.env.TEST_PRICE_EUR);
  if (process.env.VERCEL_ENV !== "production" && testPrice > 0) {
    price = { full: testPrice, total: testPrice, deposit: testPrice };
  }
  const stay = weekList(week, weeks);

  try {
    const [booked, pending] = await Promise.all([bookedWeeks(), pendingWeeks()]);
    if (stay.some((w) => booked.has(w) || pending.has(w))) return json({ error: ERR.unavailable }, 409);

    const ref = bookingsCol().doc();
    const booking = {
      week,
      weeks,
      status: "checkout",
      name,
      email,
      phone,
      guests,
      adults: adults ?? guests,
      children,
      note,
      lang,
      full: price.full,
      total: price.total,
      amount: price.deposit,
      currency: "eur",
      paymentMethod: method,
      createdAt: FieldValue.serverTimestamp(),
    };

    if (method === "bank") {
      // Nema Stripea: zahtjev odmah čeka odluku vlasnice, isto kao nakon rezervacije na kartici.
      await ref.set({ ...booking, status: "pending", authorizedAt: FieldValue.serverTimestamp() });
      const saved = { id: ref.id, ...booking, status: "pending" };
      await Promise.all([
        sendMail(guestMail("received", saved)),
        sendMail({ to: adminEmail(), ...adminMail("request", saved) }),
      ]);
      return json({ url: `${SITE_URL()}/hvala.html?nacin=racun` });
    }

    await ref.set(booking);

    const label = `House Verona · ${formatDate(week)} – ${formatDate(weekEnd(week, weeks))}`;
    const meta = { bookingId: ref.id, week, weeks: String(weeks) };
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      locale: lang,
      customer_email: email,
      client_reference_id: ref.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(price.deposit * 100),
            product_data: {
              name: label,
              description:
                `${7 * weeks} noći · ${guests} os. · uključen popust za direktnu rezervaciju` +
                (price.deposit < price.total ? ` · predujam od ukupno ${price.total} €` : ""),
            },
          },
        },
      ],
      payment_intent_data: {
        capture_method: "manual",
        description: label,
        metadata: meta,
      },
      metadata: meta,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${SITE_URL()}/hvala.html`,
      cancel_url: `${SITE_URL()}/#dostupnost`,
    });

    await ref.update({ sessionId: session.id });
    return json({ url: session.url });
  } catch (err) {
    console.error("Kreiranje rezervacije nije uspjelo", err);
    return json({ error: "server" }, 500);
  }
}
