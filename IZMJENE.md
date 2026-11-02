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
- Na stranici zahvale nakon zahtjeva s uplatom na račun maknuta je rečenica „Ako termin ipak nije slobodan, javit ćemo vam i ništa ne uplaćujete” (sva 4 jezika).
- Novi mali blok „Domaćica: Ana” iznad podnožja: mala okrugla slika (`domacin.jpg`), dvije rečenice, ocjena domaćina 10 na Bookingu i jezici (sva 4 jezika).
- Recenzije: dodane 4 s Bookinga (Robina, Stefi, Tamás, Margareth), izmiješane s onima s Googlea. Robina i Tamás su Bookingov prijevod pa uz njih piše „prijevod”. Prvo se vidi 6 recenzija (na mobitelu 3), ostale nakon klika na „Prikaži još recenzija”.
- Robina i Tamás sad su u originalu (njemački / engleski), oznaka „prijevod” više ne treba.
- Proba ukrasnog motiva u pozadini: tanka, blijeda grančica masline iza dijela „Kuća” (tekst ide preko). Klasa `.bg-motif` / `.bg-olive` u CSS-u.
- Ukrasni crteži u pozadini (grančica s 8 maslina; tanka linija, jedva vidljivi, tekst ide preko): nova grančica masline iza „Kuća”, galebovi uz galeriju i „Rezerviraj ovdje”, valovi na dnu „Rezerviraj ovdje”, kompas u „Na otoku” i koordinate Martinšćice 44° 49′ N · 14° 21′ E ispod udaljenosti.
- Naslovnica na mobitelu: na slici je samo naslov, a kockice (6 osoba, 3 spavaće sobe, 2 kupaonice, pogled na more, plaža <1 min) su manje i ispod slike. Parking je na mobitelu maknut s kockica. Prva slika je pomaknuta da oznaka „We are here” ne pada na naslov. Na računalu je sve ostalo isto.
- Kockice ispod naslovne slike na mobitelu: parking je vraćen, a kockice su tanje i uže.
- Cjenik na mobitelu: „€ / noć” je ispod cijene, u jednom redu.
- Novi odjeljak „07 — Česta pitanja” (iznad bloka s domaćicom), na klik se otvara odgovor: dolazak od 16 h (javimo ako je kuća spremna ranije), odlazak do 10 h, trajanje boravka, parking, plaža, ljubimci, dječji krevetić, boravišna pristojba, plaćanje. U izborniku su dodana „Česta pitanja”, a „Zašto direktno” je preimenovano u „Rezerviraj ovdje”.
- Česta pitanja: dodano „Ima li posteljine i ručnika?” (uključeni, a dodatni na upit). Pitanje o trajanju sad je „Kojim danima je dolazak?”: rezervacije su moguće samo od subote do subote.
- Još manje praznog prostora: razmaci između odjeljaka 44 px na računalu i 28 px na mobitelu, manji razmak ispod oznaka „01 — …” i iznad podnožja.

## Izbor jezika na vrhu izbornika
- Gumbi EN / HR / IT / DE premješteni su s dna bočnog izbornika na vrh, odmah ispod naziva kuće (na mobitelu i na računalu).

## Cjenik u adminu
- Admin ima novi odjeljak „Cjenik“: razdoblja od subote dolaska do subote odlaska i puna cijena po noći, uz stupac „Gost plaća“ (s 10% popusta). Redovi se mogu dodati, obrisati i spremiti.
- Cjenik se sprema u Firestore (`settings/prices`). Server (`api/_lib/cjenik.js`) iz njega računa iznos rezervacije, a `/api/dostupnost` ga šalje stranici.
- Kartice cjenika na stranici, naslov „Cijene 2027“ i cijena „od … / tjedan“ slažu se same iz spremljenog cjenika. Ako ima cijena za više godina, svaka godina ima svoj red kartica.
- Dok u adminu ništa nije spremljeno, vrijedi dosadašnji cjenik (`DEFAULT_SEASONS` u `cijene.js`).
- `firestore.rules` ima novi odjeljak `settings/prices` (čitanje javno, pisanje samo admin). **Treba ga objaviti u Firebase konzoli** (Firestore Database → Rules → zalijepi cijeli `firestore.rules` → Publish).
- Povijest cjenika: svako spremanje zapisuje se i u Firestore kolekciju `priceHistory` (datum, tko je spremio). U adminu je ispod cjenika „Stari cjenici“ samo za pregled, bez vraćanja. Na dnu je uvijek početni cjenik. Zapisi se ne mogu mijenjati ni brisati (pravila u `firestore.rules`).
