# Kalendar dostupnosti — postavljanje

Kalendar se prikazuje na naslovnici (sekcija *Slobodni termini*), a uređuje se na
`/admin.html`. Termin je uvijek subota → subota.

Podatke drži Firebase (Firestore), prijava ide Google računom. Sve je unutar
besplatnog Firebase plana.

## 1. Firebase projekt

1. Otvori <https://console.firebase.google.com> → **Add project** (Google
   Analytics nije potreban).
2. U projektu: **Build → Firestore Database → Create database** → *Production
   mode* → regija **eur3 (europe-west)**.
3. **Build → Authentication → Get started → Sign-in method → Google → Enable**
   (kao *support email* stavi svoj mail) → Save.

## 2. Podaci projekta u `firebase-config.js`

U Firebase konzoli: **Project settings (⚙) → General → Your apps → Web (`</>`)**
→ registriraj aplikaciju (npr. `house-verona`). Firebase ispiše `firebaseConfig`
objekt — prepiši `apiKey`, `authDomain`, `projectId` i `appId` u
`firebase-config.js`.

Te vrijednosti nisu tajna i smiju biti u javnom kodu; pisanje čuvaju Firestore
pravila iz koraka 4.

## 3. UID vlasničkog računa

1. Objavi promjene (`git push`, Vercel deploya sam) ili pokreni lokalni server
   (`python -m http.server 8000`) i otvori `/admin.html`.
2. Klikni **Prijavi se Google računom** i prijavi se računom kojim ćeš uređivati
   kalendar. Stranica će javiti *Nemate ovlasti* — to je očekivano.
3. U Firebase konzoli: **Authentication → Users** → kopiraj **User UID** tog
   računa.
4. Upiši ga u `firebase-config.js` na popis `ADMIN_UIDS`. Može ih biti više
   (npr. house.verona.cres i tvoj osobni Gmail) — svaki u svoj redak.

## 4. Sigurnosna pravila

U `firestore.rules` upiši iste UID-ove (popis u `isAdmin()`), pa cijeli sadržaj
datoteke zalijepi u **Firestore Database → Rules → Publish**.

Pravila znače: kalendar svatko može čitati, mijenjati ga smiju isključivo ti
računi, i to samo u očekivanom obliku zapisa.

## 5. Dozvoljene domene

**Authentication → Settings → Authorized domains** → dodaj
`house-verona.vercel.app` (i vlastitu domenu ako je ima). `localhost` je već
dopušten.

Nakon toga `git push` i kalendar radi.

## Dodatno očvršćivanje (preporučeno, nije nužno)

- **Ograniči API ključ na svoje domene**: Google Cloud Console → *APIs &
  Services → Credentials* → Browser key → *Website restrictions* → dodaj
  `house-verona.vercel.app/*` i `localhost/*`. Time ključ postaje neupotrebljiv
  s tuđih stranica.
- **Jaka zaštita Google računa**: uključi dvofaktorsku prijavu na Google računu
  koji je `ADMIN_UID` — to je jedina brava na uređivanju kalendara.
- **App Check** (Firebase → App Check, reCAPTCHA v3) ako se pojavi neželjeni
  promet prema bazi.

## Kako se koristi

- `/admin.html` → prijava → klik na red u kalendaru prebacuje termin između
  *slobodno* i *zauzeto*. Sprema se odmah.
- Prijava vrijedi do zatvaranja preglednika.
- Naslovnica čita isti zapis, pa je promjena vidljiva odmah nakon osvježavanja.

---

# Online rezervacije i plaćanje (Stripe)

Kako radi:

1. Gost na naslovnici klikne slobodan tjedan (subota → subota). Za dulji boravak
   klikne i zadnji tjedan (najviše `MAX_WEEKS` = 4 uzastopna tjedna). Vidi cijenu
   iz `cijene.js`, upiše podatke (odrasli i djeca, najviše 6) i ide na Stripe.
2. Stripe iznos samo **rezervira** na kartici (ne naplaćuje).
3. Gost dobiva mail „zahtjev primljen, potvrda unutar 24 h”, a vlasnica mail
   „novi zahtjev”. Tjedan je drugima prikazan kao **na upitu**.
4. U `/admin.html` je popis zahtjeva:
   - **Potvrdi i naplati** → iznos se naplaćuje, tjedan postaje zauzet, gost
     dobiva potvrdu. Ostali zahtjevi za isti tjedan automatski se odbijaju.
   - **Odbij** → rezervacija na kartici se poništava, gost dobiva mail da
     termin nije dostupan. Ništa se ne naplaćuje.
5. Jednom dnevno (07:00 UTC) server šalje podsjetnik za zahtjeve starije od
   12 h, a zahtjeve starije od 48 h sam odbija (Stripe rezervaciju na kartici
   ionako poništava nakon 7 dana).

Dok Stripe i mail nisu postavljeni, stranica radi kao i prije: kalendar je samo
informativan i nitko ne može poslati zahtjev.

## Što je gdje

| Datoteka | Što radi |
|---|---|
| `cijene.js` | cjenik po sezonama (pune cijene), popust za direktnu rezervaciju (`DIRECT_DISCOUNT`, 10%), udio koji se naplaćuje (`DEPOSIT_SHARE`), najmanje dana do dolaska, najviše tjedana (`MAX_WEEKS`) |
| `api/rezervacija.js` | gost šalje zahtjev → Stripe Checkout (`capture_method: manual`) |
| `api/stripe-webhook.js` | Stripe javlja da je kartica unesena / poništena |
| `api/admin.js` | popis, potvrda i odbijanje (samo za ADMIN_UID) |
| `api/odluka.js` | stare poveznice Potvrdi/Odbij iz ranijih mailova: samo upućuje na admin, ništa ne mijenja |
| `api/cron.js` | dnevni podsjetnik i automatsko odbijanje |
| `api/dostupnost.js` | zauzeti tjedni i tjedni na upitu za javni kalendar |
| `hvala.html` | stranica nakon plaćanja (`?nacin=racun` za uplatu na račun) |

Zahtjevi se spremaju u Firestore kolekciju `bookings`. Postojeća
`firestore.rules` pravila već zabranjuju pristup toj kolekciji iz preglednika —
čita je samo server.

## 1. Stripe račun

1. <https://dashboard.stripe.com/register> → zemlja **Hrvatska**, vrsta
   poslovanja **Individual / fizička osoba**. Trebat će OIB, osobna i IBAN.
2. Sve se prvo isproba u **Test mode** (prekidač gore desno).
3. **Developers → API keys** → kopiraj **Secret key** (`sk_test_…`, kasnije
   `sk_live_…`).

## 2. Firebase servisni ključ

Firebase konzola → ⚙ **Project settings → Service accounts → Generate new
private key**. Preuzme se JSON datoteka; njen **cijeli sadržaj** ide u Vercel
varijablu `FIREBASE_SERVICE_ACCOUNT`. Datoteku ne stavljaj u git i nakon toga
je obriši s računala.

## 3. Gmail za slanje obavijesti

1. Na Google računu s kojeg idu mailovi uključi **dvofaktorsku prijavu**.
2. <https://myaccount.google.com/apppasswords> → napravi lozinku za
   aplikaciju (npr. „House Verona”). Dobiješ 16 znakova.
3. Ta adresa ide u `SMTP_USER`, a ta lozinka (bez razmaka) u `SMTP_PASS`.

## 4. Vercel varijable

Vercel → projekt → **Settings → Environment Variables** (Production):

| Ime | Vrijednost |
|---|---|
| `STRIPE_SECRET_KEY` | iz koraka 1 |
| `STRIPE_WEBHOOK_SECRET` | iz koraka 5 |
| `FIREBASE_SERVICE_ACCOUNT` | cijeli JSON iz koraka 2 |
| `ADMIN_UID` | isti UID-ovi kao u `firebase-config.js`, više njih odvojeno zarezom |
| `SMTP_USER` | Gmail adresa |
| `SMTP_PASS` | lozinka za aplikaciju |
| `ADMIN_EMAIL` | kamo stižu obavijesti o novim zahtjevima (može biti isti Gmail) |
| `CRON_SECRET` | bilo koji dugi nasumični niz (npr. 40 slova i brojeva). |
| `SITE_URL` | `https://www.house-verona.com` |
| `AUTO_RELEASE_HOURS` | nije obavezno, zadano `48` |
| `BANK_IBAN` | IBAN za uplatu na račun (uključuje tu opciju) |
| `BANK_OWNER` | ime i prezime vlasnika tog računa |
| `BANK_BIC` | nije obavezno, BIC/SWIFT banke (korisno gostima izvan EU) |
| `BANK_NAME` | nije obavezno, naziv banke |
| `BANK_DAYS` | nije obavezno, rok za uplatu u danima, zadano `5` |

Za drugi SMTP (ne Gmail) dodaj još `SMTP_HOST` i `SMTP_PORT`.

## 5. Stripe webhook

Stripe → **Developers → Webhooks → Add endpoint**:

- URL: `https://www.house-verona.com/api/stripe-webhook`
- događaji: `checkout.session.completed`, `checkout.session.expired`,
  `payment_intent.canceled`, `payment_intent.succeeded`

Nakon spremanja otvori endpoint → **Signing secret** (`whsec_…`) → u Vercel kao
`STRIPE_WEBHOOK_SECRET`.

## 6a. Proba bez objave (Vercel Preview)

1. Promjene pushaj u zasebnu granu (npr. `test-rezervacije`), ne u `main`.
   Vercel napravi testnu objavu na adresi te grane, a www.house-verona.com
   ostaje netaknut.
2. Sve varijable iz koraka 4 moraju vrijediti i za okruženje **Preview**
   (Vercel → Environment Variables → uredi varijablu → označi Preview).
   `SITE_URL` za Preview nije potreban: server sam koristi adresu grane.
3. Vercel → Settings → **Deployment Protection** → isključi *Vercel
   Authentication* (inače Stripe ne može javiti stranici da je kartica unesena).
4. Stripe (Test mode) → webhook na `https://<adresa-grane>/api/stripe-webhook`,
   njegov `whsec_…` u Vercel kao `STRIPE_WEBHOOK_SECRET` (Preview) → Redeploy.
5. Firebase → Authentication → Settings → Authorized domains → dodaj adresu
   grane (za prijavu u admin).
6. Probno plaćanje pravom karticom za mali iznos: dodaj varijablu
   `TEST_PRICE_EUR` = `5` samo za **Preview**. Na testnoj adresi Stripe tada
   traži 5 € umjesto cijene tjedna. Na pravoj stranici se to nikad ne
   primjenjuje.

## 6. Objava i proba

1. `git push` — Vercel sam instalira pakete iz `package.json`.
2. Na stranici odaberi neki tjedan iz cjenika i plati testnom karticom
   `4242 4242 4242 4242` (bilo koji budući datum i CVC).
3. Provjeri: stigla su oba maila, tjedan je „na upitu”, u adminu se vidi
   zahtjev. Probaj **Potvrdi** i **Odbij** na dva zahtjeva.
4. Kad sve radi: u Stripeu isključi Test mode, ponovi korake 1.3 i 5 sa
   *live* ključevima i zamijeni `STRIPE_SECRET_KEY` i `STRIPE_WEBHOOK_SECRET`
   u Vercelu → **Redeploy**.

## 7. Uplata na račun (druga opcija plaćanja)

Kad su u Vercelu upisani `BANK_IBAN` i `BANK_OWNER` (i mail iz koraka 3), gost u
obrascu bira **Kartica** ili **Uplata na račun**. Ako je postavljeno samo jedno,
nudi se samo to. Uplata na račun radi i bez Stripea.

Kako teče uplata na račun:

1. Gost pošalje zahtjev — ništa ne plaća. Dobiva mail „zahtjev primljen,
   potvrda s podacima za uplatu unutar 24 h”, ti dobivaš „novi zahtjev”.
2. U adminu **Potvrdi i pošalji podatke za uplatu** → tjedni se zatvaraju, gost
   dobiva IBAN, primatelja, iznos, oznaku (npr. `House Verona HV-AB12CD`) i rok.
   Rok je `BANK_DAYS` dana od potvrde, ali najkasnije dan prije dolaska.
3. Rezervacija se pojavljuje u bloku **Čekaju uplatu na račun**:
   - **Označi plaćeno** kad novac stigne (prepoznaješ ga po oznaci u opisu
     uplate) → gost dobiva mail da je uplata zaprimljena.
   - **Otkaži — nije plaćeno** → tjedni se oslobađaju, gost dobiva mail o otkazu.
4. Ako rok prođe, a uplata nije označena, dnevni cron ti jednom pošalje
   podsjetnik. Ništa se ne otkazuje samo.

## Napomene

- **Cjenik za novu godinu**: dodaj redove u `SEASONS` u `cijene.js` (pune
  cijene; popust se odbija sam). Cijene u kartama cjenika u `index.html` treba
  ručno uskladiti. Tjedni
  koji nisu cijeli u cjeniku prikazuju se kao slobodni, ali ih se ne može
  rezervirati online (gost se javlja porukom).
- **Ručno zatvaranje** (npr. rezervacija s Bookinga) i dalje radi klikom na
  tjedan u adminu. Ako za taj tjedan postoji zahtjev, odbij ga.
- **Potvrda izravno u Stripeu** (Capture u Stripe sučelju) isto radi — server
  to prepozna i zatvori tjedan.
- **Porez i računi**: provjeri s knjigovođom/Poreznom upravom što za privatnog
  iznajmljivača znači naplata karticom (račun, fiskalizacija).
- **Vercel Hobby** plan je po Vercelovim uvjetima namijenjen nekomercijalnoj
  upotrebi; za stranicu koja naplaćuje rezervacije Vercel može tražiti Pro plan.
