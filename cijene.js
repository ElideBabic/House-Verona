/* Cjenik — dijele ga stranica (prikaz cijene) i server (iznos koji se rezervira na kartici).
   Server uvijek sam računa iznos iz ove tablice, cijena iz preglednika se ne koristi.

   Svaki red: prva i zadnja NOĆ sezone (uključivo) i cijena po noći u eurima.
   Tjedan se može rezervirati online samo ako je svih 7 noći unutar neke sezone;
   ostali tjedni (npr. zimi) prikazuju se kao "na upit".

   Cjenik se mijenja u adminu (odjeljak "Cjenik"); spremljen je u Firestoreu (settings/prices).
   Ova tablica je samo zadana vrijednost dok u adminu ništa nije spremljeno. */

export const DEFAULT_SEASONS = [
  // 2027
  { from: "2027-03-20", to: "2027-06-18", night: 275 },
  { from: "2027-06-19", to: "2027-07-09", night: 315 },
  { from: "2027-07-10", to: "2027-07-23", night: 360 },
  { from: "2027-07-24", to: "2027-08-13", night: 410 },
  { from: "2027-08-14", to: "2027-08-20", night: 360 },
  { from: "2027-08-21", to: "2027-08-27", night: 315 },
  { from: "2027-08-28", to: "2027-10-30", night: 275 },
];

/** Trenutni cjenik. Isti niz se puni iz admina (setSeasons), pa ga svi koji ga uvoze vide promijenjenog. */
export const SEASONS = DEFAULT_SEASONS.map((s) => ({ ...s }));

const isIsoDate = (iso) => {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10) === iso;
};

/**
 * Provjera cjenika iz admina. Vraća { ok: true, seasons } (sortirano) ili { ok: false, error }.
 * Pravila: 1–60 redova, ispravni datumi, od ≤ do, cijena 1–10000 €, redovi se ne preklapaju.
 */
export function validateSeasons(list) {
  if (!Array.isArray(list) || list.length < 1 || list.length > 60) return { ok: false, error: "Cjenik mora imati od 1 do 60 redova." };
  const rows = [];
  for (const r of list) {
    if (!r || !isIsoDate(r.from) || !isIsoDate(r.to)) return { ok: false, error: "Neki datum nije ispravan." };
    if (r.from > r.to) return { ok: false, error: `Red ${formatDate(r.from)}: početak je nakon kraja.` };
    const night = Number(r.night);
    if (!Number.isFinite(night) || night < 1 || night > 10000) return { ok: false, error: `Red ${formatDate(r.from)}: cijena nije ispravna.` };
    rows.push({ from: r.from, to: r.to, night: round2(night) });
  }
  rows.sort((a, b) => (a.from < b.from ? -1 : 1));
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].from <= rows[i - 1].to) return { ok: false, error: `Redovi ${formatDate(rows[i - 1].from)} i ${formatDate(rows[i].from)} se preklapaju.` };
  }
  return { ok: true, seasons: rows };
}

/** Postavi cjenik (npr. onaj spremljen u adminu). Neispravan cjenik se ignorira. Vraća true ako je postavljen. */
export function setSeasons(list) {
  const v = validateSeasons(list);
  if (!v.ok) return false;
  SEASONS.splice(0, SEASONS.length, ...v.seasons);
  return true;
}

/** Popust za direktnu rezervaciju preko stranice (0.1 = 10%). Cijene u SEASONS su pune cijene. */
export const DIRECT_DISCOUNT = 0.1;

/** Dodatni popust u eurima za uplatu na račun (po rezervaciji, bez obzira na broj tjedana). 0 = bez popusta. */
export const BANK_DISCOUNT_EUR = 10;

/** Koliki dio cijene se rezervira i naplaćuje online (1 = cijeli iznos, 0.3 = 30% predujam). */
export const DEPOSIT_SHARE = 1;

/** Najmanje dana do dolaska da bi se termin mogao rezervirati online (vrijeme za potvrdu). */
export const MIN_DAYS_AHEAD = 3;

export const NIGHTS = 7;
export const MAX_GUESTS = 6;

/** Najviše uzastopnih tjedana u jednoj online rezervaciji. */
export const MAX_WEEKS = 4;

function nightPrice(iso) {
  const season = SEASONS.find((s) => iso >= s.from && iso <= s.to);
  return season ? season.night : null;
}

export function isoAddDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

/** Je li ISO datum stvarna subota u ispravnom obliku. */
export function isSaturday(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toISOString().slice(0, 10) === iso && date.getUTCDay() === 6;
}

/** Datum odlaska: subota nakon `weeks` tjedana (zadano 1). */
export function weekEnd(iso, weeks = 1) {
  return isoAddDays(iso, NIGHTS * weeks);
}

/** Popis početnih subota za boravak od `weeks` tjedana. */
export function weekList(iso, weeks = 1) {
  return Array.from({ length: weeks }, (_, i) => isoAddDays(iso, NIGHTS * i));
}

/**
 * Cijena tjedna koji počinje subotom `iso`.
 * Vraća { total, deposit } u eurima, ili null ako tjedan nije u cjeniku.
 */
export function weekPrice(iso) {
  if (!isSaturday(iso)) return null;
  let full = 0;
  for (let i = 0; i < NIGHTS; i++) {
    const p = nightPrice(isoAddDays(iso, i));
    if (p == null) return null;
    full += p;
  }
  return withDiscount(full);
}

const round2 = (n) => Math.round(n * 100) / 100;

/** Iz pune cijene: { full, total (s popustom), deposit (dio koji se naplaćuje online) }. */
function withDiscount(full) {
  const total = round2(full * (1 - DIRECT_DISCOUNT));
  return { full, total, deposit: round2(total * DEPOSIT_SHARE) };
}

/** Cijena noćenja s popustom, za prikaz u cjeniku. */
export const discounted = (night) => round2(night * (1 - DIRECT_DISCOUNT));

/**
 * Cijena boravka od `weeks` uzastopnih tjedana od subote `iso`.
 * Vraća { total, deposit } ili null ako bilo koji tjedan nije u cjeniku.
 */
export function stayPrice(iso, weeks = 1) {
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > MAX_WEEKS) return null;
  let full = 0;
  for (const w of weekList(iso, weeks)) {
    const p = weekPrice(w);
    if (!p) return null;
    full += p.full;
  }
  return withDiscount(full);
}

/** Cijena za odabrani način plaćanja: kod uplate na račun oduzima BANK_DISCOUNT_EUR. */
export function priceFor(price, method) {
  if (!price || method !== "bank" || !BANK_DISCOUNT_EUR) return price;
  return {
    ...price,
    total: round2(price.total - BANK_DISCOUNT_EUR),
    deposit: round2(price.deposit - BANK_DISCOUNT_EUR),
    bankDiscount: BANK_DISCOUNT_EUR,
  };
}

/** Može li se tjedan rezervirati online s obzirom na datum (ne gleda zauzetost). */
export function isBookableOnline(iso, today = new Date()) {
  if (!weekPrice(iso)) return false;
  const t = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const earliest = new Date(t.getTime() + MIN_DAYS_AHEAD * 86400000).toISOString().slice(0, 10);
  return iso >= earliest;
}

export function formatEur(amount) {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/** "03.07.2027." */
export function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}.`;
}
