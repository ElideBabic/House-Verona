/* Tekstovi mailova. Gost dobiva mail na jeziku na kojem je gledao stranicu,
   vlasnica uvijek na hrvatskom. */

import { formatDate, formatEur, weekEnd } from "../../cijene.js";
import { SITE_URL, bankDetails, bankDays } from "./servisi.js";

const CONTACT = "WhatsApp: +385 91 126 0214 · e-mail: house.verona.cres@gmail.com";

/** Kratka oznaka rezervacije koju gost upisuje u opis uplate. */
export const bookingRef = (b) => `HV-${String(b.id || "").slice(0, 6).toUpperCase()}`;

const BANK_LABELS = {
  hr: { owner: "Primatelj", iban: "IBAN", bic: "BIC/SWIFT", bank: "Banka", amount: "Iznos", ref: "Opis plaćanja", due: "Rok uplate" },
  en: { owner: "Account holder", iban: "IBAN", bic: "BIC/SWIFT", bank: "Bank", amount: "Amount", ref: "Payment reference", due: "Pay by" },
  it: { owner: "Beneficiario", iban: "IBAN", bic: "BIC/SWIFT", bank: "Banca", amount: "Importo", ref: "Causale", due: "Scadenza" },
  de: { owner: "Empfänger", iban: "IBAN", bic: "BIC/SWIFT", bank: "Bank", amount: "Betrag", ref: "Verwendungszweck", due: "Zahlbar bis" },
};

function bankBlock(b, lang) {
  const L = BANK_LABELS[lang];
  const bank = bankDetails() || { owner: "—", iban: "—", bic: "", bank: "" };
  return [
    `${L.owner}: ${bank.owner}`,
    `${L.iban}: ${bank.iban}`,
    bank.bic && `${L.bic}: ${bank.bic}`,
    bank.bank && `${L.bank}: ${bank.bank}`,
    `${L.amount}: ${formatEur(b.amount)}`,
    `${L.ref}: House Verona ${bookingRef(b)}`,
    b.payBy && `${L.due}: ${formatDate(b.payBy)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function dates(b) {
  return `${formatDate(b.week)} – ${formatDate(weekEnd(b.week, b.weeks || 1))}`;
}

const GUEST = {
  received: {
    hr: (b) => ({
      subject: "House Verona — zahtjev za rezervaciju je primljen",
      text: `Poštovani/a ${b.name},

hvala na zahtjevu za boravak u House Verona od ${dates(b)} (subota – subota).

Iznos od ${formatEur(b.amount)} rezerviran je na vašoj kartici, ali još NIJE naplaćen.
Potvrdu rezervacije poslat ćemo vam na ovaj mail unutar 24 sata.

Ako termin ipak nije slobodan, rezervacija na kartici se poništava i ništa vam neće biti naplaćeno.

Za pitanja nam se slobodno javite — ${CONTACT}

Srdačan pozdrav,
House Verona`,
    }),
    en: (b) => ({
      subject: "House Verona — booking request received",
      text: `Dear ${b.name},

thank you for your request to stay at House Verona from ${dates(b)} (Saturday to Saturday).

${formatEur(b.amount)} has been reserved on your card but has NOT been charged yet.
We will send your booking confirmation to this address within 24 hours.

If the dates turn out to be unavailable, the hold on your card is released and nothing is charged.

Questions? Just get in touch — ${CONTACT}

Kind regards,
House Verona`,
    }),
    it: (b) => ({
      subject: "House Verona — richiesta di prenotazione ricevuta",
      text: `Gentile ${b.name},

grazie per la richiesta di soggiorno a House Verona dal ${dates(b)} (da sabato a sabato).

L'importo di ${formatEur(b.amount)} è stato bloccato sulla sua carta ma NON è ancora stato addebitato.
Le invieremo la conferma della prenotazione a questo indirizzo entro 24 ore.

Se le date non fossero più disponibili, il blocco sulla carta viene annullato e non le verrà addebitato nulla.

Per qualsiasi domanda — ${CONTACT}

Cordiali saluti,
House Verona`,
    }),
    de: (b) => ({
      subject: "House Verona — Buchungsanfrage erhalten",
      text: `Guten Tag ${b.name},

vielen Dank für Ihre Anfrage für House Verona vom ${dates(b)} (Samstag bis Samstag).

Der Betrag von ${formatEur(b.amount)} wurde auf Ihrer Karte reserviert, aber NOCH NICHT abgebucht.
Die Buchungsbestätigung senden wir Ihnen innerhalb von 24 Stunden an diese Adresse.

Sollte der Termin nicht mehr frei sein, wird die Reservierung auf Ihrer Karte aufgehoben und nichts abgebucht.

Bei Fragen melden Sie sich gerne — ${CONTACT}

Herzliche Grüße,
House Verona`,
    }),
  },

  confirmed: {
    hr: (b) => ({
      subject: "House Verona — rezervacija je potvrđena",
      text: `Poštovani/a ${b.name},

s veseljem potvrđujemo vašu rezervaciju u House Verona od ${dates(b)}

Iznos od ${formatEur(b.amount)} je naplaćen s vaše kartice.
Dolazak i odlazak su u subotu. Prije dolaska javit ćemo vam se s detaljima.

${CONTACT}

Radujemo se vašem dolasku!
House Verona`,
    }),
    en: (b) => ({
      subject: "House Verona — your booking is confirmed",
      text: `Dear ${b.name},

we are happy to confirm your stay at House Verona from ${dates(b)}

${formatEur(b.amount)} has now been charged to your card.
Arrival and departure are on Saturday. We will be in touch with the details before you arrive.

${CONTACT}

We look forward to welcoming you!
House Verona`,
    }),
    it: (b) => ({
      subject: "House Verona — prenotazione confermata",
      text: `Gentile ${b.name},

siamo lieti di confermare il suo soggiorno a House Verona dal ${dates(b)}

L'importo di ${formatEur(b.amount)} è stato addebitato sulla sua carta.
Arrivo e partenza sono di sabato. Prima del suo arrivo la contatteremo con i dettagli.

${CONTACT}

La aspettiamo!
House Verona`,
    }),
    de: (b) => ({
      subject: "House Verona — Ihre Buchung ist bestätigt",
      text: `Guten Tag ${b.name},

wir freuen uns, Ihren Aufenthalt in House Verona vom ${dates(b)} zu bestätigen.

Der Betrag von ${formatEur(b.amount)} wurde von Ihrer Karte abgebucht.
An- und Abreise sind am Samstag. Vor Ihrer Ankunft melden wir uns mit allen Details.

${CONTACT}

Wir freuen uns auf Sie!
House Verona`,
    }),
  },

  released: {
    hr: (b) => ({
      subject: "House Verona — termin nažalost nije dostupan",
      text: `Poštovani/a ${b.name},

nažalost, termin od ${dates(b)} više nije dostupan i ne možemo potvrditi vašu rezervaciju.

Rezervacija iznosa na vašoj kartici je poništena — ništa vam nije naplaćeno. Ovisno o banci, iznos može još nekoliko dana biti prikazan kao rezerviran.

Rado ćemo vam pomoći pronaći drugi termin: ${SITE_URL()}/#dostupnost ili ${CONTACT}

Srdačan pozdrav,
House Verona`,
    }),
    en: (b) => ({
      subject: "House Verona — dates unfortunately not available",
      text: `Dear ${b.name},

unfortunately the dates ${dates(b)} are no longer available and we cannot confirm your booking.

The hold on your card has been cancelled — nothing has been charged. Depending on your bank, the amount may still appear as reserved for a few days.

We would be glad to help you find other dates: ${SITE_URL()}/#dostupnost or ${CONTACT}

Kind regards,
House Verona`,
    }),
    it: (b) => ({
      subject: "House Verona — date purtroppo non disponibili",
      text: `Gentile ${b.name},

purtroppo le date ${dates(b)} non sono più disponibili e non possiamo confermare la prenotazione.

Il blocco sulla sua carta è stato annullato — non le è stato addebitato nulla. A seconda della banca, l'importo può risultare bloccato ancora per qualche giorno.

Saremo lieti di aiutarla a trovare altre date: ${SITE_URL()}/#dostupnost oppure ${CONTACT}

Cordiali saluti,
House Verona`,
    }),
    de: (b) => ({
      subject: "House Verona — Termin leider nicht verfügbar",
      text: `Guten Tag ${b.name},

leider ist der Termin ${dates(b)} nicht mehr verfügbar, und wir können Ihre Buchung nicht bestätigen.

Die Reservierung auf Ihrer Karte wurde aufgehoben — es wurde nichts abgebucht. Je nach Bank kann der Betrag noch einige Tage als reserviert angezeigt werden.

Gerne helfen wir Ihnen, einen anderen Termin zu finden: ${SITE_URL()}/#dostupnost oder ${CONTACT}

Herzliche Grüße,
House Verona`,
    }),
  },

  receivedBank: {
    hr: (b) => ({
      subject: "House Verona — zahtjev za rezervaciju je primljen",
      text: `Poštovani/a ${b.name},

hvala na zahtjevu za boravak u House Verona od ${dates(b)} (subota – subota).

Odabrali ste uplatu na račun. Zasad ne trebate ništa plaćati.
Potvrdu rezervacije poslat ćemo vam na ovaj mail unutar 24 sata, zajedno s podacima za uplatu iznosa od ${formatEur(b.amount)}. Uplatu je zatim potrebno izvršiti u roku od ${bankDays()} dana.

Za pitanja nam se slobodno javite — ${CONTACT}

Srdačan pozdrav,
House Verona`,
    }),
    en: (b) => ({
      subject: "House Verona — booking request received",
      text: `Dear ${b.name},

thank you for your request to stay at House Verona from ${dates(b)} (Saturday to Saturday).

You chose to pay by bank transfer. There is nothing to pay yet.
We will send your booking confirmation to this address within 24 hours, together with the bank details for the amount of ${formatEur(b.amount)}. The transfer is then due within ${bankDays()} days.

Questions? Just get in touch — ${CONTACT}

Kind regards,
House Verona`,
    }),
    it: (b) => ({
      subject: "House Verona — richiesta di prenotazione ricevuta",
      text: `Gentile ${b.name},

grazie per la richiesta di soggiorno a House Verona dal ${dates(b)} (da sabato a sabato).

Ha scelto il pagamento con bonifico bancario. Per ora non deve pagare nulla.
Entro 24 ore le invieremo la conferma della prenotazione con i dati per il bonifico di ${formatEur(b.amount)}, da effettuare entro ${bankDays()} giorni.

Per qualsiasi domanda — ${CONTACT}

Cordiali saluti,
House Verona`,
    }),
    de: (b) => ({
      subject: "House Verona — Buchungsanfrage erhalten",
      text: `Guten Tag ${b.name},

vielen Dank für Ihre Anfrage für House Verona vom ${dates(b)} (Samstag bis Samstag).

Sie haben Banküberweisung gewählt. Sie müssen jetzt noch nichts bezahlen.
Innerhalb von 24 Stunden senden wir Ihnen die Buchungsbestätigung mit den Bankdaten für den Betrag von ${formatEur(b.amount)}. Die Überweisung ist dann innerhalb von ${bankDays()} Tagen fällig.

Bei Fragen melden Sie sich gerne — ${CONTACT}

Herzliche Grüße,
House Verona`,
    }),
  },

  confirmedBank: {
    hr: (b) => ({
      subject: "House Verona — rezervacija je potvrđena, podaci za uplatu",
      text: `Poštovani/a ${b.name},

s veseljem potvrđujemo vašu rezervaciju u House Verona od ${dates(b)}

Molimo da iznos uplatite na račun:

${bankBlock(b, "hr")}

Kad uplata stigne, javit ćemo vam se mailom. Dolazak i odlazak su u subotu, a prije dolaska poslat ćemo vam sve detalje.

${CONTACT}

Radujemo se vašem dolasku!
House Verona`,
    }),
    en: (b) => ({
      subject: "House Verona — booking confirmed, payment details",
      text: `Dear ${b.name},

we are happy to confirm your stay at House Verona from ${dates(b)}

Please transfer the amount to:

${bankBlock(b, "en")}

We will let you know by e-mail once the payment arrives. Arrival and departure are on Saturday, and we will send you all the details before you arrive.

${CONTACT}

We look forward to welcoming you!
House Verona`,
    }),
    it: (b) => ({
      subject: "House Verona — prenotazione confermata, dati per il bonifico",
      text: `Gentile ${b.name},

siamo lieti di confermare il suo soggiorno a House Verona dal ${dates(b)}

La preghiamo di effettuare il bonifico a:

${bankBlock(b, "it")}

Le scriveremo appena riceviamo il pagamento. Arrivo e partenza sono di sabato; prima del suo arrivo le invieremo tutti i dettagli.

${CONTACT}

La aspettiamo!
House Verona`,
    }),
    de: (b) => ({
      subject: "House Verona — Buchung bestätigt, Zahlungsdaten",
      text: `Guten Tag ${b.name},

wir freuen uns, Ihren Aufenthalt in House Verona vom ${dates(b)} zu bestätigen.

Bitte überweisen Sie den Betrag an:

${bankBlock(b, "de")}

Sobald die Zahlung eingegangen ist, melden wir uns per E-Mail. An- und Abreise sind am Samstag; vor Ihrer Ankunft senden wir Ihnen alle Details.

${CONTACT}

Wir freuen uns auf Sie!
House Verona`,
    }),
  },

  releasedBank: {
    hr: (b) => ({
      subject: "House Verona — termin nažalost nije dostupan",
      text: `Poštovani/a ${b.name},

nažalost, termin od ${dates(b)} više nije dostupan i ne možemo potvrditi vašu rezervaciju. Ništa niste platili niti trebate platiti.

Rado ćemo vam pomoći pronaći drugi termin: ${SITE_URL()}/#dostupnost ili ${CONTACT}

Srdačan pozdrav,
House Verona`,
    }),
    en: (b) => ({
      subject: "House Verona — dates unfortunately not available",
      text: `Dear ${b.name},

unfortunately the dates ${dates(b)} are no longer available and we cannot confirm your booking. You have not paid anything and there is nothing to pay.

We would be glad to help you find other dates: ${SITE_URL()}/#dostupnost or ${CONTACT}

Kind regards,
House Verona`,
    }),
    it: (b) => ({
      subject: "House Verona — date purtroppo non disponibili",
      text: `Gentile ${b.name},

purtroppo le date ${dates(b)} non sono più disponibili e non possiamo confermare la prenotazione. Non ha pagato nulla e non deve pagare nulla.

Saremo lieti di aiutarla a trovare altre date: ${SITE_URL()}/#dostupnost oppure ${CONTACT}

Cordiali saluti,
House Verona`,
    }),
    de: (b) => ({
      subject: "House Verona — Termin leider nicht verfügbar",
      text: `Guten Tag ${b.name},

leider ist der Termin ${dates(b)} nicht mehr verfügbar, und wir können Ihre Buchung nicht bestätigen. Sie haben nichts bezahlt und müssen nichts bezahlen.

Gerne helfen wir Ihnen, einen anderen Termin zu finden: ${SITE_URL()}/#dostupnost oder ${CONTACT}

Herzliche Grüße,
House Verona`,
    }),
  },

  paid: {
    hr: (b) => ({
      subject: "House Verona — uplata je zaprimljena",
      text: `Poštovani/a ${b.name},

vaša uplata od ${formatEur(b.amount)} je stigla — hvala! Rezervacija od ${dates(b)} je time u potpunosti plaćena.

Prije dolaska javit ćemo vam se s detaljima. ${CONTACT}

Vidimo se na Cresu!
House Verona`,
    }),
    en: (b) => ({
      subject: "House Verona — payment received",
      text: `Dear ${b.name},

your payment of ${formatEur(b.amount)} has arrived — thank you! Your stay from ${dates(b)} is now fully paid.

We will be in touch with the details before you arrive. ${CONTACT}

See you on Cres!
House Verona`,
    }),
    it: (b) => ({
      subject: "House Verona — pagamento ricevuto",
      text: `Gentile ${b.name},

abbiamo ricevuto il suo pagamento di ${formatEur(b.amount)} — grazie! Il soggiorno dal ${dates(b)} è interamente pagato.

Prima del suo arrivo la contatteremo con i dettagli. ${CONTACT}

A presto a Cres!
House Verona`,
    }),
    de: (b) => ({
      subject: "House Verona — Zahlung erhalten",
      text: `Guten Tag ${b.name},

Ihre Zahlung von ${formatEur(b.amount)} ist eingegangen — vielen Dank! Ihr Aufenthalt vom ${dates(b)} ist damit vollständig bezahlt.

Vor Ihrer Ankunft melden wir uns mit allen Details. ${CONTACT}

Bis bald auf Cres!
House Verona`,
    }),
  },

  cancelledUnpaid: {
    hr: (b) => ({
      subject: "House Verona — rezervacija je otkazana",
      text: `Poštovani/a ${b.name},

uplatu za rezervaciju od ${dates(b)} nismo zaprimili u dogovorenom roku pa je rezervacija otkazana, a termin ponovno slobodan.

Ako ste uplatu ipak izvršili ili je došlo do zabune, javite nam se što prije — ${CONTACT}

Srdačan pozdrav,
House Verona`,
    }),
    en: (b) => ({
      subject: "House Verona — booking cancelled",
      text: `Dear ${b.name},

we have not received the payment for your stay from ${dates(b)} within the agreed time, so the booking has been cancelled and the dates released.

If you have already paid or there has been a mix-up, please get in touch as soon as possible — ${CONTACT}

Kind regards,
House Verona`,
    }),
    it: (b) => ({
      subject: "House Verona — prenotazione annullata",
      text: `Gentile ${b.name},

non abbiamo ricevuto il pagamento per il soggiorno dal ${dates(b)} entro il termine concordato, quindi la prenotazione è stata annullata e le date sono di nuovo libere.

Se ha già pagato o si tratta di un malinteso, ci contatti al più presto — ${CONTACT}

Cordiali saluti,
House Verona`,
    }),
    de: (b) => ({
      subject: "House Verona — Buchung storniert",
      text: `Guten Tag ${b.name},

die Zahlung für Ihren Aufenthalt vom ${dates(b)} ist nicht fristgerecht eingegangen. Die Buchung wurde daher storniert und der Termin wieder freigegeben.

Falls Sie bereits bezahlt haben oder ein Missverständnis vorliegt, melden Sie sich bitte umgehend — ${CONTACT}

Herzliche Grüße,
House Verona`,
    }),
  },
};

export function guestMail(kind, booking) {
  // Za uplatu na račun postoje posebni tekstovi (bez spominjanja kartice).
  const key = booking.paymentMethod === "bank" && GUEST[`${kind}Bank`] ? `${kind}Bank` : kind;
  const lang = GUEST[key][booking.lang] ? booking.lang : "en";
  return { to: booking.email, ...GUEST[key][lang](booking) };
}

function details(b) {
  return `Termin: ${dates(b)} (${b.weeks || 1} ${(b.weeks || 1) === 1 ? "tjedan" : "tjedna"})
Iznos: ${formatEur(b.amount)}${b.total && b.total !== b.amount ? ` (od ukupno ${formatEur(b.total)})` : ""}
Gost: ${b.name}
Email: ${b.email}
Telefon: ${b.phone || "—"}
Broj osoba: ${b.guests}${b.children ? ` (${b.adults} odraslih, ${b.children} djece)` : ""}
Plaćanje: ${b.paymentMethod === "bank" ? `uplata na račun (oznaka ${bookingRef(b)})` : "kartica (Stripe)"}
Jezik: ${b.lang}
Poruka: ${b.note || "—"}`;
}

const ADMIN = {
  request: (b) => ({
    subject: `Novi zahtjev za rezervaciju: ${dates(b)}`,
    text: `Stigao je novi zahtjev za rezervaciju. ${
      b.paymentMethod === "bank"
        ? "Gost je odabrao uplatu na račun: kad potvrdiš, automatski dobiva podatke za uplatu. Kad novac stigne, u adminu klikni \"Označi plaćeno\"."
        : "Iznos je rezerviran na gostovoj kartici, ali nije naplaćen."
    }

${details(b)}

Potvrdi ili odbij ovdje: ${SITE_URL()}/admin.html
Gost je obaviješten da potvrdu dobiva unutar 24 sata.`,
  }),
  reminder: (b) => ({
    subject: `Podsjetnik: zahtjev čeka potvrdu (${dates(b)})`,
    text: `Ovaj zahtjev još čeka tvoju odluku.

${details(b)}

${SITE_URL()}/admin.html`,
  }),
  expired: (b) => ({
    subject: `Zahtjev automatski odbijen: ${dates(b)}`,
    text: `Zahtjev nije potvrđen na vrijeme pa je ${b.paymentMethod === "bank" ? "zatvoren" : "rezervacija na kartici poništena"}, a gost je obaviješten da termin nije dostupan.

${details(b)}`,
  }),
  overdue: (b) => ({
    subject: `Uplata nije stigla na vrijeme: ${dates(b)}`,
    text: `Rok za uplatu na račun (${formatDate(b.payBy)}) je prošao, a uplata još nije označena kao primljena.

${details(b)}

Ako je novac stigao, u adminu klikni "Označi plaćeno". Ako nije, javi se gostu ili rezervaciju otkaži ("Otkaži — nije plaćeno") pa se tjedni oslobađaju.
${SITE_URL()}/admin.html`,
  }),
  cancelledExternally: (b) => ({
    subject: `Rezervacija na kartici je poništena: ${dates(b)}`,
    text: `Stripe je javio da je rezervacija iznosa za ovaj zahtjev poništena izvan stranice (npr. u Stripe sučelju ili je istekla). Zahtjev je označen kao poništen. Gostu nije poslan mail.

${details(b)}`,
  }),
};

export function adminMail(kind, booking) {
  return { ...ADMIN[kind](booking), replyTo: booking.email };
}
