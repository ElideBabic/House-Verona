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
