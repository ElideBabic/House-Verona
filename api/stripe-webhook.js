/* POST /api/stripe-webhook — Stripe javlja što se dogodilo s plaćanjem.
   U Stripe Dashboardu → Developers → Webhooks dodaj ovaj URL s događajima:
   checkout.session.completed, checkout.session.expired,
   payment_intent.canceled, payment_intent.succeeded */

import { getStripe, json } from "./_lib/servisi.js";
import { onAuthorized, onCheckoutExpired, onCanceled, finalizeConfirmed } from "./_lib/rezervacije.js";

export async function POST(request) {
  const payload = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      request.headers.get("stripe-signature"),
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Neispravan Stripe potpis", err.message);
    return json({ error: "signature" }, 400);
  }

  const obj = event.data.object;
  const bookingId = obj.metadata?.bookingId;
  if (!bookingId) return json({ ignored: true });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const pi = await getStripe().paymentIntents.retrieve(obj.payment_intent);
        if (pi.status === "requires_capture") await onAuthorized(bookingId, pi.id);
        break;
      }
      case "checkout.session.expired":
        await onCheckoutExpired(bookingId);
        break;
      case "payment_intent.canceled":
        await onCanceled(bookingId);
        break;
      case "payment_intent.succeeded":
        // Naplaćeno izravno u Stripe sučelju umjesto preko admina — isto kao potvrda.
        await finalizeConfirmed(bookingId);
        break;
    }
  } catch (err) {
    console.error("Obrada Stripe događaja nije uspjela", event.type, bookingId, err);
    return json({ error: "processing" }, 500); // Stripe će pokušati ponovno
  }
  return json({ received: true });
}
