/* POST /api/admin — admin sučelje: popis zahtjeva, potvrda i odbijanje,
   a za uplatu na račun i "označi plaćeno" / "otkaži — nije plaćeno".
   Pristup samo s Firebase prijavom vlasničkog računa (ADMIN_UID). */

import { adminAuth, json } from "./_lib/servisi.js";
import { bookingsCol, confirm, release, markPaid, cancelUnpaid, UserError } from "./_lib/rezervacije.js";
import { bookingRef } from "./_lib/mailovi.js";

async function isAdmin(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || !process.env.ADMIN_UID) return false;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return decoded.uid === process.env.ADMIN_UID;
  } catch {
    return false;
  }
}

const ts = (v) => (v && typeof v.toDate === "function" ? v.toDate().toISOString() : null);

export async function POST(request) {
  if (!(await isAdmin(request))) return json({ error: "Nemate ovlasti" }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Neispravan zahtjev" }, 400);
  }

  try {
    switch (body.action) {
      case "list": {
        const snap = await bookingsCol().orderBy("createdAt", "desc").limit(200).get();
        const bookings = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((b) => b.status !== "checkout" && b.status !== "expired")
          .map((b) => ({
            id: b.id,
            week: b.week,
            weeks: b.weeks || 1,
            status: b.status,
            reason: b.reason ?? null,
            name: b.name,
            email: b.email,
            phone: b.phone,
            guests: b.guests,
            adults: b.adults ?? b.guests,
            children: b.children ?? 0,
            note: b.note,
            lang: b.lang,
            amount: b.amount,
            total: b.total,
            paymentMethod: b.paymentMethod || "card",
            ref: bookingRef(b),
            payBy: b.payBy ?? null,
            paidAt: ts(b.paidAt),
            createdAt: ts(b.createdAt),
            authorizedAt: ts(b.authorizedAt),
            decidedAt: ts(b.decidedAt),
          }));
        return json({ bookings });
      }
      case "confirm":
        await confirm(String(body.id));
        return json({ ok: true });
      case "reject": {
        const done = await release(String(body.id), "rejected");
        if (!done) throw new UserError("Zahtjev više ne čeka potvrdu", 409);
        return json({ ok: true });
      }
      case "paid":
        await markPaid(String(body.id));
        return json({ ok: true });
      case "cancelUnpaid":
        await cancelUnpaid(String(body.id));
        return json({ ok: true });
      default:
        return json({ error: "Nepoznata radnja" }, 400);
    }
  } catch (err) {
    if (err instanceof UserError) return json({ error: err.message }, err.status);
    console.error("Admin radnja nije uspjela", body.action, err);
    return json({ error: err.message || "Greška na serveru" }, 500);
  }
}
