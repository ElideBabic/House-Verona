/* /api/odluka — potvrda ili odbijanje zahtjeva izravno iz maila, bez prijave.
   GET  ?id=…&a=confirm|reject&t=potpis  → stranica s pregledom i jednim gumbom
   POST (isti podaci iz obrasca)          → izvrši odluku
   Odluka se izvršava tek na POST, jer programi za provjeru mailova (Gmail,
   antivirusi) znaju sami otvoriti poveznice — samo otvaranje ne smije ništa promijeniti. */

import { verifyAction } from "./_lib/servisi.js";
import { bookingsCol, confirm, release, UserError } from "./_lib/rezervacije.js";
import { bookingRef } from "./_lib/mailovi.js";
import { formatDate, formatEur, weekEnd } from "../cijene.js";

const ACTIONS = {
  confirm: { title: "Potvrdi rezervaciju", button: "✓ Da, potvrdi rezervaciju", color: "#2e6b3a" },
  reject: { title: "Odbij zahtjev", button: "✕ Da, odbij zahtjev", color: "#9b2c2c" },
};

const STATUS = {
  confirmed: "već je potvrđen",
  released: "je već odbijen ili zatvoren",
  cancelled: "je poništen",
  expired: "je istekao",
  checkout: "još nije plaćen (gost nije dovršio plaćanje)",
};

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function page(title, body, status = 200) {
  const html = `<!doctype html>
<html lang="hr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)} · House Verona</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #f4efe6; color: #26231e; font: 16px/1.55 Arial, sans-serif; }
  main { max-width: 480px; margin: 0 auto; padding: 32px 16px 48px; }
  .brand { font: 600 13px/1 Arial, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #8a6d3b; margin-bottom: 18px; }
  h1 { font: 600 26px/1.2 Georgia, serif; margin: 0 0 18px; }
  .card { background: #fff; border: 1px solid #e3dccf; padding: 18px 20px; margin-bottom: 20px; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 0; }
  dt { color: #6b645a; }
  dd { margin: 0; word-break: break-word; }
  button { width: 100%; padding: 15px 18px; border: 0; color: #fff; font: 700 17px Arial, sans-serif; cursor: pointer; }
  .note { font-size: 14px; color: #6b645a; }
  .ok { border-left: 4px solid #2e6b3a; }
  .warn { border-left: 4px solid #9b2c2c; }
  a { color: #26231e; }
</style>
</head>
<body><main><div class="brand">House Verona</div>${body}</main></body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
    },
  });
}

const adminLink = `<p class="note">Sve rezervacije su i u <a href="/admin.html">adminu</a>.</p>`;

function summary(b) {
  const weeks = b.weeks || 1;
  return `<div class="card"><dl>
<dt>Termin</dt><dd>${esc(formatDate(b.week))} – ${esc(formatDate(weekEnd(b.week, weeks)))} (${weeks} ${weeks === 1 ? "tjedan" : "tjedna"})</dd>
<dt>Gost</dt><dd>${esc(b.name)}</dd>
<dt>Email</dt><dd>${esc(b.email)}</dd>
<dt>Osoba</dt><dd>${esc(b.guests)}</dd>
<dt>Iznos</dt><dd>${esc(formatEur(b.amount))}</dd>
<dt>Plaćanje</dt><dd>${b.paymentMethod === "bank" ? `uplata na račun (${esc(bookingRef(b))})` : "kartica"}</dd>
${b.note ? `<dt>Poruka</dt><dd>${esc(b.note)}</dd>` : ""}
</dl></div>`;
}

function invalid() {
  return page(
    "Poveznica ne vrijedi",
    `<h1>Poveznica ne vrijedi</h1><div class="card warn">Poveznica je neispravna ili nepotpuna. Otvori je ponovno iz maila ili odluči u adminu.</div>${adminLink}`,
    403,
  );
}

async function load(id) {
  const snap = await bookingsCol().doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

function notPending(b) {
  return page(
    "Zahtjev je već riješen",
    `<h1>Ovaj zahtjev ${esc(STATUS[b.status] || "više ne čeka odluku")}</h1>${summary(b)}<p>Ništa nije promijenjeno.</p>${adminLink}`,
  );
}

async function read(request) {
  if (request.method === "GET") {
    const q = new URL(request.url).searchParams;
    return { id: q.get("id"), action: q.get("a"), token: q.get("t") };
  }
  const form = await request.formData().catch(() => null);
  return { id: form?.get("id"), action: form?.get("a"), token: form?.get("t") };
}

export async function GET(request) {
  const { id, action, token } = await read(request);
  if (!ACTIONS[action] || !verifyAction(id, action, token)) return invalid();

  try {
    const b = await load(id);
    if (!b) return invalid();
    if (b.status !== "pending") return notPending(b);

    const A = ACTIONS[action];
    const what =
      action === "confirm"
        ? b.paymentMethod === "bank"
          ? "Gost će dobiti mail s potvrdom i podacima za uplatu, a tjedni će biti zauzeti u kalendaru."
          : "Iznos rezerviran na gostovoj kartici bit će naplaćen, gost dobiva mail s potvrdom, a tjedni postaju zauzeti u kalendaru."
        : b.paymentMethod === "bank"
          ? "Gost će dobiti mail da termin nije dostupan."
          : "Rezervirani iznos na gostovoj kartici bit će otpušten (ništa se ne naplaćuje), a gost dobiva mail da termin nije dostupan.";

    return page(
      A.title,
      `<h1>${esc(A.title)}?</h1>${summary(b)}
<p>${what}</p>
<form method="post" action="/api/odluka">
<input type="hidden" name="id" value="${esc(id)}">
<input type="hidden" name="a" value="${esc(action)}">
<input type="hidden" name="t" value="${esc(token)}">
<button type="submit" style="background:${A.color}">${esc(A.button)}</button>
</form>
<p class="note">Ako si se predomislila, samo zatvori ovu stranicu.</p>${adminLink}`,
    );
  } catch (err) {
    console.error("Odluka: učitavanje nije uspjelo", id, err);
    return page("Greška", `<h1>Nešto nije u redu</h1><div class="card warn">Pokušaj ponovno za minutu ili odluči u adminu.</div>${adminLink}`, 500);
  }
}

export async function POST(request) {
  const { id, action, token } = await read(request);
  if (!ACTIONS[action] || !verifyAction(id, action, token)) return invalid();

  try {
    const b = await load(id);
    if (!b) return invalid();
    if (b.status !== "pending") return notPending(b);

    if (action === "confirm") {
      await confirm(id);
      return page(
        "Rezervacija potvrđena",
        `<h1>Rezervacija je potvrđena ✓</h1><div class="card ok">${
          b.paymentMethod === "bank"
            ? "Gost je dobio potvrdu i podatke za uplatu. Kad novac stigne, u adminu klikni „Označi plaćeno”."
            : "Iznos je naplaćen s gostove kartice i gost je dobio potvrdu."
        } Tjedni su zauzeti u kalendaru.</div>${summary(b)}${adminLink}`,
      );
    }

    const done = await release(id, "rejected");
    if (!done) return notPending((await load(id)) || b);
    return page(
      "Zahtjev odbijen",
      `<h1>Zahtjev je odbijen</h1><div class="card ok">${
        b.paymentMethod === "bank" ? "" : "Rezervirani iznos je otpušten s gostove kartice. "
      }Gost je dobio mail da termin nije dostupan.</div>${summary(b)}${adminLink}`,
    );
  } catch (err) {
    if (err instanceof UserError) {
      return page("Nije moguće", `<h1>Nije moguće</h1><div class="card warn">${esc(err.message)}</div>${adminLink}`, err.status);
    }
    console.error("Odluka nije uspjela", action, id, err);
    return page("Greška", `<h1>Nešto nije u redu</h1><div class="card warn">${esc(err.message || "Greška na serveru")}</div>${adminLink}`, 500);
  }
}
