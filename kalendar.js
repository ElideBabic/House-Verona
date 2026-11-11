/* Kalendar dostupnosti — dijele ga index.html (samo prikaz) i admin.html (uređivanje).
   Termin je uvijek jedan tjedan: subota → subota. Ključ tjedna je ISO datum početne subote. */

const MONTHS = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  hr: ["Siječanj","Veljača","Ožujak","Travanj","Svibanj","Lipanj","Srpanj","Kolovoz","Rujan","Listopad","Studeni","Prosinac"],
  it: ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"],
  de: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
};

const DOW = {
  en: ["Sat","Sun","Mon","Tue","Wed","Thu","Fri"],
  hr: ["Sub","Ned","Pon","Uto","Sri","Čet","Pet"],
  it: ["Sab","Dom","Lun","Mar","Mer","Gio","Ven"],
  de: ["Sa","So","Mo","Di","Mi","Do","Fr"],
};

const STATE_LABEL = {
  free: { en: "Free", hr: "Slobodno", it: "Libero", de: "Frei" },
  booked: { en: "Booked", hr: "Zauzeto", it: "Occupato", de: "Belegt" },
  pending: { en: "On hold", hr: "Na upitu", it: "In attesa", de: "Angefragt" },
  past: { en: "Past", hr: "Prošlo", it: "Passato", de: "Vorbei" },
  selected: { en: "Selected", hr: "Odabrano", it: "Scelto", de: "Gewählt" },
};

const NAV_LABEL = {
  prev: { en: "Previous month", hr: "Prethodni mjesec", it: "Mese precedente", de: "Vorheriger Monat" },
  next: { en: "Next month", hr: "Sljedeći mjesec", it: "Mese successivo", de: "Nächster Monat" },
};

const LANGS = ["en", "hr", "it", "de"];

export function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

export function isoDate(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Subota na dan ili prije zadanog datuma. */
export function weekStart(date) {
  const out = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return addDays(out, -((out.getDay() + 1) % 7));
}

export function monthWeeks(year, month) {
  const lastDay = new Date(year, month + 1, 0);
  const weeks = [];
  let cursor = weekStart(new Date(year, month, 1));
  while (cursor <= lastDay) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

function shortDate(date) {
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.`;
}

/** Kad je lang zadan vraća čisti tekst, inače sve četiri verzije kao .lang-xx spanove. */
function label(map, lang) {
  if (lang) return map[lang];
  return LANGS.map((l) => `<span class="lang-${l}">${map[l]}</span>`).join("");
}

/** Čita zauzete tjedne preko Firestore REST API-ja — bez SDK-a, jedan mali zahtjev. */
export async function fetchBookedWeeks({ projectId, apiKey }) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/availability/weeks?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return new Set();
  if (!res.ok) throw new Error(`Firestore ${res.status}`);
  const data = await res.json();
  const values = data?.fields?.booked?.arrayValue?.values ?? [];
  return new Set(values.map((v) => v.stringValue).filter(Boolean));
}

/** Zauzeti tjedni i tjedni na upitu preko /api/dostupnost (uključuje zahtjeve koji čekaju potvrdu). */
export async function fetchAvailability() {
  const res = await fetch("/api/dostupnost", { cache: "no-store" });
  if (!res.ok) throw new Error(`Dostupnost ${res.status}`);
  const data = await res.json();
  return {
    booked: new Set(data.booked ?? []),
    pending: new Set(data.pending ?? []),
    online: data.online === true,
    // Stariji server ne šalje načine plaćanja — tada je to samo kartica.
    methods: data.methods ?? { card: data.online === true, bank: false },
    bankDays: data.bankDays ?? 2,
    // Cjenik iz admina; stariji server ga ne šalje — tada ostaje cjenik iz cijene.js.
    seasons: Array.isArray(data.seasons) ? data.seasons : null,
  };
}

export class Calendar {
  constructor(el, options = {}) {
    this.el = el;
    this.lang = options.lang || null;
    this.editable = Boolean(options.editable);
    this.onToggle = options.onToggle;
    this.onError = options.onError;
    this.monthsShown = options.monthsShown || 2;
    /** Gost: funkcija (key) => bool koja kaže može li se slobodan tjedan odabrati. */
    this.isSelectable = options.isSelectable || null;
    this.onSelect = options.onSelect;
    this.selected = new Set();
    this.booked = new Set();
    this.pending = new Set();
    this.busy = false;

    const now = new Date();
    this.today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    this.view = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    this.minView = new Date(this.view);
    this.maxView = new Date(this.today.getFullYear() + 2, 11, 1);

    el.classList.add("cal");
    if (this.editable || this.isSelectable) el.classList.add("is-editable");
    el.addEventListener("click", (e) => this._onClick(e));
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const row = e.target.closest(".cal-week[role='button']");
      if (!row) return;
      e.preventDefault();
      this._activate(row.dataset.week);
    });
  }

  setBooked(booked, pending) {
    this.booked = booked;
    if (pending) this.pending = pending;
    this.render();
  }

  /** Označi odabrane tjedne (jedan ključ, niz ključeva ili null). */
  setSelected(keys) {
    this.selected = new Set(keys == null ? [] : Array.isArray(keys) ? keys : [keys]);
    this.render();
  }

  _activate(key) {
    if (this.editable) this._toggleSafely(key);
    else if (this.isSelectable) this.onSelect?.(key);
  }

  _interactive(key, state) {
    if (this.editable) return state !== "past";
    return Boolean(this.isSelectable) && state === "free" && this.isSelectable(key);
  }

  _onClick(e) {
    const nav = e.target.closest(".cal-nav");
    if (nav) {
      this._move(Number(nav.dataset.dir));
      return;
    }
    if (this.busy) return;
    const row = e.target.closest(".cal-week[role='button']");
    if (row) this._activate(row.dataset.week);
  }

  _toggleSafely(key) {
    this._toggle(key).catch((err) => this.onError?.(err));
  }

  _move(dir) {
    const next = new Date(this.view.getFullYear(), this.view.getMonth() + dir, 1);
    if (next < this.minView || next > this.maxView) return;
    this.view = next;
    this.render();
  }

  async _toggle(key) {
    const previous = this.booked;
    const next = new Set(previous);
    if (next.has(key)) next.delete(key);
    else next.add(key);

    this.busy = true;
    this.booked = next;
    this.render();
    try {
      await this.onToggle([...next].sort(), key, next.has(key));
    } catch (err) {
      this.booked = previous;
      this.render();
      throw err;
    } finally {
      this.busy = false;
    }
  }

  _weekState(key) {
    if (key < isoDate(this.today)) return "past";
    if (this.booked.has(key)) return "booked";
    return this.pending.has(key) ? "pending" : "free";
  }

  _monthHtml(year, month) {
    const lang = this.lang || "en";
    const head = DOW.en
      .map((_, i) => {
        const text = this.lang ? DOW[this.lang][i] : LANGS.map((l) => `<span class="lang-${l}">${DOW[l][i]}</span>`).join("");
        return `<div class="cal-dow-cell${i === 0 ? " is-checkin" : ""}">${text}</div>`;
      })
      .join("");

    const rows = monthWeeks(year, month)
      .map((days) => {
        const key = isoDate(days[0]);
        const state = this._weekState(key);
        const cells = days
          .map((d) => {
            const out = d.getMonth() === month ? "" : " is-out";
            const checkin = d.getDay() === 6 ? " is-checkin" : "";
            return `<div class="cal-day${out}${checkin}">${d.getDate()}</div>`;
          })
          .join("");
        const aria = `${shortDate(days[0])} – ${shortDate(addDays(days[0], 7))} ${STATE_LABEL[state][lang]}`;
        const interactive = this._interactive(key, state) ? ` role="button" tabindex="0"` : "";
        const selected = this.selected.has(key) ? " is-selected" : "";
        return (
          `<div class="cal-week is-${state}${selected}" data-week="${key}"${interactive} aria-label="${aria}">` +
          `${cells}<div class="cal-chip">${label(STATE_LABEL[selected ? "selected" : state], this.lang)}</div></div>`
        );
      })
      .join("");

    const name = this.lang
      ? `${MONTHS[this.lang][month]} ${year}`
      : LANGS.map((l) => `<span class="lang-${l}">${MONTHS[l][month]} ${year}</span>`).join("");

    return (
      `<div class="cal-month"><div class="cal-month-name">${name}</div>` +
      `<div class="cal-dow">${head}</div>${rows}</div>`
    );
  }

  render() {
    const months = Array.from({ length: this.monthsShown }, (_, i) =>
      new Date(this.view.getFullYear(), this.view.getMonth() + i, 1),
    );
    const years = [...new Set(months.map((m) => m.getFullYear()))].join(" – ");
    const prevDisabled =
      new Date(this.view.getFullYear(), this.view.getMonth() - 1, 1) < this.minView;
    const nextDisabled =
      new Date(this.view.getFullYear(), this.view.getMonth() + 1, 1) > this.maxView;

    const legend = ["free", "pending", "booked", "past"]
      .map(
        (s) =>
          `<span class="cal-legend-item"><i class="cal-dot is-${s}"></i>${label(STATE_LABEL[s], this.lang)}</span>`,
      )
      .join("");

    const navLang = this.lang || "en";
    this.el.innerHTML =
      `<div class="cal-head">` +
      `<button type="button" class="cal-nav" data-dir="-1" aria-label="${NAV_LABEL.prev[navLang]}"${prevDisabled ? " disabled" : ""}>&#8249;</button>` +
      `<span class="cal-year">${years}</span>` +
      `<button type="button" class="cal-nav" data-dir="1" aria-label="${NAV_LABEL.next[navLang]}"${nextDisabled ? " disabled" : ""}>&#8250;</button>` +
      `</div>` +
      `<div class="cal-grid">${months.map((m) => this._monthHtml(m.getFullYear(), m.getMonth())).join("")}</div>` +
      `<div class="cal-legend">${legend}</div>`;
  }
}
