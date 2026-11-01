# Izmjene — online rezervacije (31.10.2026.)

Ova mapa sadrži sve datoteke stranice osim slika. Kopiraj je preko svoje mape
`stranica` (slike `slika*.jpg` ostaju kakve jesu) i prati upute na dnu
`POSTAVLJANJE.md` ("Online rezervacije i plaćanje").

Nove datoteke: `cijene.js`, `hvala.html`, `package.json`, `.vercelignore`,
mapa `api/` (serverski dio za Vercel), `IZMJENE.md`.

Izmijenjene: `index.html` (novi izgled: izbornik sa strane, rezervacija odmah
na naslovnici, jedan ili više uzastopnih tjedana, odrasli/djeca), `admin.html` (zahtjevi,
Potvrdi/Odbij, povijest), `kalendar.js` i `kalendar.css` (stanje „na upitu”,
odabir tjedna), `vercel.json` (dnevni cron), `robots.txt`, `llms.txt`,
`POSTAVLJANJE.md`.

Nepromijenjeno (nisu u ovoj mapi): slike. Nepromijenjeno: `firebase-config.js`, `firestore.rules`,
`recenzija.html`, `sitemap.xml`.

## 01.11.2026. (kasno) — sitnice

- Maknut odjeljak "Čekamo tebe / Ready when you are" iznad podnožja.
- Nova fotografija maslina kod poklona dobrodošlice (`maslinovo-ulje.jpg`).

## 01.11.2026. (kasno) — odjeljak s recenzijama

- Novi odjeljak "Što kažu naši gosti" (06 — Recenzije) pri dnu, iznad poziva na kontakt,
  i stavka "Recenzije" u izborniku. Gumbi "Pogledaj sve na Googleu" i "Ostavite recenziju".
- Recenzije se upisuju u novu datoteku `recenzije.js` (ime, tekst, ocjena, izvor, datum)
  i ukupna ocjena s Googlea. Dok je popis prazan, odjeljak se ne prikazuje.

## 01.11.2026. (kasno) — manje teksta kod plaćanja karticom

- Kartica: "Platite odmah, sigurno preko Stripea", gumb "Plati sada", korak "Plaćanje".
  Maknuta objašnjenja o rezerviranju/naplati i popisi koraka ispod načina plaćanja.
- Kvačica uvjeta za karticu: "Slažem se da se iznos rezervira na mojoj kartici."
- Poruke o greškama u obrascu su posebne za svaki slučaj: nedostaje ime, prazan e-mail,
  neispravan e-mail, nije označena kvačica (tekst ovisi o načinu plaćanja). Kursor skoči na prvo polje s greškom.
- Stranica "Hvala" i mail gostu nakon plaćanja: samo "Hvala na rezervaciji, potvrdu dobivate unutar 24 sata".
  Ako termin ne možemo potvrditi, gost i dalje dobiva mail s objašnjenjem (kao prije).

## 01.11.2026. (kasno) — poticaj za uplatu na račun

- Uplata na račun je prva i unaprijed odabrana opcija, s oznakom
  "Preporučeno · −10 €" i prednostima (bez kartice, bez blokiranja iznosa).
- Dodatnih 10 € popusta po rezervaciji za uplatu na račun (`BANK_DISCOUNT_EUR`
  u `cijene.js`, 0 = isključeno). Sažetak cijene pokazuje redak "Uplata na račun −10 €",
  server sam računa umanjeni iznos, a vlasnica u mailu vidi da je popust uključen.

## 01.11.2026. (prije objave) — adresa stranice

- `index.html`, `llms.txt`, `recenzija.html`, `robots.txt`, `sitemap.xml`:
  adresa stranice je sad https://www.house-verona.com (umjesto house-verona.vercel.app).

## 01.11.2026. (večer) — Potvrdi/Odbij iz maila, više admin računa

- Mail "Novi zahtjev" (i podsjetnik) ima gumbe **Potvrdi rezervaciju** i
  **Odbij**. Klik otvara kratku stranicu s pregledom i jednim gumbom za
  potvrdu — bez prijave. Odluka se izvršava tek na tom drugom kliku, jer
  Gmail/antivirusi znaju sami otvoriti poveznice iz maila. Poveznice su
  potpisane (`CRON_SECRET` ili `LINK_SECRET`) i vrijede samo dok zahtjev čeka.
  Nova datoteka: `api/odluka.js`.
- Admin može imati više Google računa: `ADMIN_UIDS` u `firebase-config.js`,
  popis u `firestore.rules`, a u Vercelu `ADMIN_UID` s UID-ovima odvojenim zarezom.

## 01.11.2026. — uplata na račun, tekst o popustu, maslinovo ulje

- **Uplata na račun** kao druga opcija plaćanja (upute u `POSTAVLJANJE.md`,
  korak 7). Nove Vercel varijable: `BANK_IBAN`, `BANK_OWNER`, po želji
  `BANK_BIC`, `BANK_NAME`, `BANK_DAYS`. U adminu novi blok „Čekaju uplatu na
  račun” s gumbima **Označi plaćeno** i **Otkaži — nije plaćeno**.
- **Tekst o popustu** u dijelu „Zašto direktno” i ispod cjenika: 10% popusta
  kad se rezervira preko stranice, ili javiti se na WhatsApp pa dogovoriti.
  Dodan gumb „Rezerviraj na stranici −10%”.
- **Maslinovo ulje**: istaknuto kao široka kartica „03 Poklon dobrodošlice”
  unutar dijela „Zašto direktno” (uz 10% popusta). Slika se učitava iz
  `maslinovo-ulje.jpg` u istoj mapi kao `index.html`. Dok te datoteke nema,
  prikazuje se nacrtana grančica masline.
- Maknut i red s koracima rezervacije iznad kalendara (Odaberite termin · Vaši podaci · …).
- Manje praznog prostora: razmaci između odjeljaka smanjeni (100 → 64 px na računalu, 40 px na mobitelu). Dio „Kuća” je kraći: ispod naslova je slika terase (slika3.jpg), citat o telefonu je maknut, a tekst je malo manji.
- Na mobitelu se slika terase ispod naslova „Kuća” ne prikazuje (samo na računalu).
- Odjeljak „Rezerviraj ovdje. 10% jeftinije.” (prije „Skip the agencies”) je sažet: samo −10% i maslinovo ulje, ispod gumb za rezervaciju, a WhatsApp je ispod kao „Imaš pitanje? Uvijek nam se možeš javiti”. Mail adresa je sad vidljiva (prije je bila svijetla na svijetloj pozadini).
- Popust od 10 € za uplatu na račun više se ne oduzima čim gost klikne tjedan. Sažetak tada pokazuje običnu cijenu (s 10% popusta), a −10 € se pojavi tek kad gost otvori obrazac i odabere uplatu na račun.
- Gumbi Potvrdi / Odbij u mailu su maknuti: mail za novi zahtjev i podsjetnik imaju samo poveznicu na admin, gdje se sve odlučuje. Poveznice iz starih mailova (`api/odluka.js`) sad samo upućuju na admin i ništa ne mijenjaju.
- „Što kuća nudi” je kompaktniji: na računalu 4 kockice u redu umjesto 3, na mobitelu 2 u redu umjesto 1, s manjim ikonama i razmacima (na mobitelu je dio više nego upola kraći).
