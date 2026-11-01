/* GET /api/cron — Vercel ga pokreće jednom dnevno (vercel.json → crons).
   - podsjeti vlasnicu na zahtjeve koji čekaju
   - zahtjeve koji predugo čekaju automatski odbije (prije nego Stripe nakon 7 dana
     sam poništi rezervaciju na kartici)
   - zatvori napuštene Stripe sesije
   - javi vlasnici kad prođe rok za uplatu na račun, a uplata nije označena */

import { json, sendMail, adminEmail } from "./_lib/servisi.js";
import { bookingsCol, release, onCheckoutExpired } from "./_lib/rezervacije.js";
import { adminMail } from "./_lib/mailovi.js";

const HOUR = 3600 * 1000;

export async function GET(request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return json({ error: "Nemate ovlasti" }, 401);
  }

  const autoReleaseHours = Number(process.env.AUTO_RELEASE_HOURS || 48);
  const now = Date.now();
  const report = { reminded: 0, released: 0, expired: 0, overdue: 0, errors: 0 };

  const pending = await bookingsCol().where("status", "==", "pending").get();
  for (const doc of pending.docs) {
    const b = { id: doc.id, ...doc.data() };
    const age = now - (b.authorizedAt?.toMillis?.() ?? now);
    try {
      if (age > autoReleaseHours * HOUR) {
        if (await release(b.id, "timeout")) {
          await sendMail({ to: adminEmail(), ...adminMail("expired", b) });
          report.released++;
        }
      } else if (age > 12 * HOUR) {
        await sendMail({ to: adminEmail(), ...adminMail("reminder", b) });
        report.reminded++;
      }
    } catch (err) {
      console.error("Cron: obrada zahtjeva nije uspjela", b.id, err);
      report.errors++;
    }
  }

  const stale = await bookingsCol().where("status", "==", "checkout").get();
  for (const doc of stale.docs) {
    const created = doc.data().createdAt?.toMillis?.() ?? now;
    if (now - created > 2 * HOUR) {
      await onCheckoutExpired(doc.id);
      report.expired++;
    }
  }

  const today = new Date(now).toISOString().slice(0, 10);
  const bank = await bookingsCol().where("paymentMethod", "==", "bank").where("status", "==", "confirmed").get();
  for (const doc of bank.docs) {
    const b = { id: doc.id, ...doc.data() };
    if (b.paidAt || b.overdueNotified || !b.payBy || b.payBy >= today) continue;
    try {
      await sendMail({ to: adminEmail(), ...adminMail("overdue", b) });
      await doc.ref.update({ overdueNotified: true });
      report.overdue++;
    } catch (err) {
      console.error("Cron: podsjetnik za uplatu nije uspio", b.id, err);
      report.errors++;
    }
  }

  return json(report);
}
