/* Životni ciklus zahtjeva za rezervaciju (Firestore kolekcija `bookings`):

   checkout   gost je otišao na Stripe, još nije unio karticu
   pending    iznos je rezerviran na kartici (ili je gost odabrao uplatu na račun), čeka potvrdu vlasnice
   confirmed  vlasnica je potvrdila → tjedan zauzet. Kartica: iznos naplaćen.
              Uplata na račun: gost dobiva podatke za uplatu, a kad novac stigne vlasnica
              označi `paidAt`.
   released   odbijeno (ručno, istek roka ili tjedan zauzet) → rezervacija na kartici poništena
   expired    gost nije dovršio plaćanje na Stripeu
   cancelled  rezervacija na kartici poništena izvan stranice (Stripe sučelje / istek),
              ili je vlasnica otkazala potvrđenu uplatu na račun koja nije stigla */

import { FieldValue } from "firebase-admin/firestore";
import { db, getStripe, sendMail, adminEmail, bankDays } from "./servisi.js";
import { guestMail, adminMail } from "./mailovi.js";
import { weekList, isoAddDays } from "../../cijene.js";

/** Svi tjedni jednog zahtjeva (stari zapisi bez `weeks` su jedan tjedan). */
export const stayWeeks = (b) => weekList(b.week, b.weeks || 1);
const overlaps = (a, b) => stayWeeks(a).some((w) => stayWeeks(b).includes(w));

export const bookingsCol = () => db().collection("bookings");
const weeksRef = () => db().collection("availability").doc("weeks");

export async function bookedWeeks() {
  const snap = await weeksRef().get();
  return new Set(snap.exists ? snap.data().booked ?? [] : []);
}

export async function pendingWeeks() {
  const snap = await bookingsCol().where("status", "==", "pending").get();
  return new Set(snap.docs.flatMap((d) => stayWeeks(d.data())));
}

/** Atomarno prebacuje zahtjev iz jednog od `from` stanja u `to`. Vraća podatke ili null. */
async function transition(id, from, to, extra = {}, onTx) {
  const ref = bookingsCol().doc(id);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || !from.includes(snap.data().status)) return null;
    const data = snap.data();
    if (onTx) await onTx(tx, data);
    tx.update(ref, { status: to, ...extra, updatedAt: FieldValue.serverTimestamp() });
    return { id, ...data, ...extra, status: to, previousStatus: data.status };
  });
}

/** Stripe javlja da je gost unio karticu i iznos je rezerviran. */
export async function onAuthorized(id, paymentIntentId) {
  const ref = bookingsCol().doc(id);
  const snap = await ref.get();
  // "expired" je dopušten ako je Stripeova obavijest zakasnila nakon čišćenja.
  const from = ["checkout", "expired"];
  if (!snap.exists || !from.includes(snap.data().status)) return;

  await ref.update({ paymentIntentId });
  const booked = await bookedWeeks();

  if (stayWeeks(snap.data()).some((w) => booked.has(w))) {
    // U međuvremenu je neki od tjedana zatvoren — odmah vraćamo novac.
    await release(id, "unavailable", from);
    return;
  }

  const booking = await transition(id, from, "pending", {
    authorizedAt: FieldValue.serverTimestamp(),
  });
  if (!booking) return;

  await Promise.all([
    sendMail(guestMail("received", booking)),
    sendMail({ to: adminEmail(), ...adminMail("request", booking) }),
  ]);
}

/**
 * Odbija zahtjev: označi ga, poništi rezervaciju na kartici i obavijesti gosta.
 * Stanje se mijenja prije poništavanja kako Stripeov webhook ne bi isti događaj
 * shvatio kao poništenje izvana.
 */
export async function release(id, reason, from = ["pending"], { notifyGuest = true } = {}) {
  const booking = await transition(id, from, "released", {
    reason,
    decidedAt: FieldValue.serverTimestamp(),
  });
  if (!booking) return null;

  if (booking.paymentIntentId) {
    try {
      const pi = await getStripe().paymentIntents.retrieve(booking.paymentIntentId);
      if (pi.status !== "canceled") await getStripe().paymentIntents.cancel(pi.id);
    } catch (err) {
      await bookingsCol().doc(id).update({
        status: booking.previousStatus,
        reason: FieldValue.delete(),
        decidedAt: FieldValue.delete(),
      });
      throw new Error(`Poništavanje na kartici nije uspjelo: ${err.message}`);
    }
  }

  if (notifyGuest) await sendMail(guestMail("released", booking));
  return booking;
}

/** Nakon naplate: zahtjev potvrđen, tjedan zauzet, ostali zahtjevi za isti tjedan odbijeni. */
export async function finalizeConfirmed(id, extra = {}) {
  const booking = await transition(
    id,
    ["pending"],
    "confirmed",
    { decidedAt: FieldValue.serverTimestamp(), ...extra },
    async (tx, data) => {
      tx.set(
        weeksRef(),
        {
          booked: FieldValue.arrayUnion(...stayWeeks(data)),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: "rezervacija",
        },
        { merge: true },
      );
    },
  );
  if (!booking) return null;

  await sendMail(guestMail("confirmed", booking));

  // Ostali zahtjevi koji se preklapaju s ovim boravkom više ne mogu proći.
  // Gost koji je još na Stripeu bit će odbijen čim unese karticu (onAuthorized).
  const others = await bookingsCol().where("status", "==", "pending").get();
  for (const doc of others.docs) {
    if (doc.id === id || !overlaps(doc.data(), booking)) continue;
    try {
      await release(doc.id, "unavailable");
    } catch (err) {
      console.error("Odbijanje drugog zahtjeva nije uspjelo", doc.id, err);
    }
  }
  return booking;
}

export class UserError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Vlasnica potvrđuje zahtjev: naplati rezervirani iznos i zatvori tjedan. */
export async function confirm(id) {
  const snap = await bookingsCol().doc(id).get();
  if (!snap.exists) throw new UserError("Zahtjev ne postoji", 404);
  const data = snap.data();
  if (data.status === "confirmed") return;
  if (data.status !== "pending") throw new UserError("Zahtjev više ne čeka potvrdu", 409);

  const booked = await bookedWeeks();
  if (stayWeeks(data).some((w) => booked.has(w))) {
    throw new UserError(
      "Barem jedan od tih tjedana je u kalendaru već označen kao zauzet. Odbij zahtjev, ili prvo oslobodi tjedan u kalendaru ako je to greška.",
      409,
    );
  }

  if (data.paymentMethod === "bank") {
    await finalizeConfirmed(id, { payBy: payByDate(data.week) });
    return;
  }

  const stripe = getStripe();
  const pi = await stripe.paymentIntents.retrieve(data.paymentIntentId);
  if (pi.status === "requires_capture") {
    await stripe.paymentIntents.capture(pi.id);
  } else if (pi.status !== "succeeded") {
    await transition(id, ["pending"], "cancelled", { reason: `stripe:${pi.status}` });
    throw new UserError("Rezervacija na kartici više ne vrijedi (istekla ili poništena). Zahtjev je zatvoren.", 409);
  }

  await finalizeConfirmed(id);
}

/** Rok za uplatu na račun: BANK_DAYS dana od potvrde, ali najkasnije dan prije dolaska. */
export function payByDate(arrival, today = new Date()) {
  const due = isoAddDays(today.toISOString().slice(0, 10), bankDays());
  const dayBefore = isoAddDays(arrival, -1);
  return due < dayBefore ? due : dayBefore;
}

async function bankBooking(tx, id) {
  const ref = bookingsCol().doc(id);
  const snap = await tx.get(ref);
  if (!snap.exists) throw new UserError("Rezervacija ne postoji", 404);
  const data = snap.data();
  if (data.paymentMethod !== "bank" || data.status !== "confirmed") {
    throw new UserError("To nije potvrđena rezervacija s uplatom na račun", 409);
  }
  return { ref, data };
}

/** Vlasnica označava da je uplata na račun stigla. Gost dobiva potvrdu primitka. */
export async function markPaid(id) {
  const booking = await db().runTransaction(async (tx) => {
    const { ref, data } = await bankBooking(tx, id);
    if (data.paidAt) return null;
    tx.update(ref, { paidAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return { id, ...data };
  });
  if (booking) await sendMail(guestMail("paid", booking));
}

/** Vlasnica otkazuje potvrđenu rezervaciju jer uplata nije stigla: tjedni se oslobađaju. */
export async function cancelUnpaid(id) {
  const booking = await db().runTransaction(async (tx) => {
    const { ref, data } = await bankBooking(tx, id);
    if (data.paidAt) {
      throw new UserError("Uplata je već označena kao primljena — takvu rezervaciju otkaži s gostom izravno.", 409);
    }
    tx.set(
      weeksRef(),
      {
        booked: FieldValue.arrayRemove(...stayWeeks(data)),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "otkazano-neplaceno",
      },
      { merge: true },
    );
    tx.update(ref, {
      status: "cancelled",
      reason: "unpaid",
      cancelledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { id, ...data };
  });
  await sendMail(guestMail("cancelledUnpaid", booking));
}

/** Stripe javlja da je rezervacija na kartici poništena. */
export async function onCanceled(id) {
  const booking = await transition(id, ["pending"], "cancelled", {
    reason: "stripe",
    decidedAt: FieldValue.serverTimestamp(),
  });
  if (booking) await sendMail({ to: adminEmail(), ...adminMail("cancelledExternally", booking) });
}

export async function onCheckoutExpired(id) {
  await transition(id, ["checkout"], "expired");
}
