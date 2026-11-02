/* GET /api/dostupnost — zauzeti tjedni, tjedni koji čekaju potvrdu i cjenik, za javni kalendar. */

import { json, payMethods, bankDays } from "./_lib/servisi.js";
import { bookedWeeks, pendingWeeks } from "./_lib/rezervacije.js";
import { loadSeasons } from "./_lib/cjenik.js";

export async function GET() {
  try {
    const [booked, pending, seasons] = await Promise.all([bookedWeeks(), pendingWeeks(), loadSeasons()]);
    const methods = payMethods();
    return json(
      {
        booked: [...booked].sort(),
        pending: [...pending].filter((w) => !booked.has(w)).sort(),
        // Online rezervacija se uključuje tek kad je postavljen mail i barem jedan način plaćanja
        // (kartica: Stripe ključevi, uplata na račun: BANK_IBAN + BANK_OWNER).
        online: methods.card || methods.bank,
        methods,
        bankDays: bankDays(),
        // Cjenik iz admina (pune cijene po noći), da stranica prikazuje iste cijene kao server.
        seasons,
      },
      200,
      { "cache-control": "public, s-maxage=20, stale-while-revalidate=60" },
    );
  } catch (err) {
    console.error(err);
    return json({ error: "unavailable" }, 503);
  }
}
