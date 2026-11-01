/* Recenzije gostiju za odjeljak "Što kažu gosti" na naslovnici.
   Upiši samo stvarne recenzije (kopiraj tekst s Googlea, Bookinga, Airbnba…).
   Dok je popis prazan, odjeljak se ne prikazuje.

   Svaka recenzija:
     name    – ime gosta kako ga želiš prikazati (npr. "Marco R.")
     text    – tekst recenzije, na jeziku na kojem je napisana
     rating  – ocjena 1–5 (nije obavezno)
     source  – "Google", "Booking.com", "Airbnb"… (nije obavezno)
     date    – npr. "kolovoz 2026" ili "2026-08" (nije obavezno)
*/

export const REVIEWS = [
  {"name": "Erik J.", "rating": 5, "source": "Google", "date": "2026", "text": "Super clean and newly renovated house, with the beach literally just a few steps away. The hosts were incredibly kind, supportive, and always replied promptly.\nAn absolute highlight: barbecue in the garden with the sea view. Nothing to complain about. Happily come back anytime!"},
  {"name": "Lenka", "rating": 5, "source": "Google", "date": "2026", "text": "The accommodation is great, fully equipped with everything you need for an amazing holiday. Located 1 minute from the beach it gives a big advantage to use the privacy of small garden with sunbeds. You can even prepair your own grilled fish there. The hosts are very friendly and ready to help if needed. The gift - their home-made olive oil - was appreciated. The village is nice and not crowded. I hope we will come back ❤️"},
  {"name": "Darko C.", "rating": 5, "source": "Google", "date": "2026", "text": "We had an absolutely wonderful stay at House Verona in Martinšćica. The house has been beautifully restored, combining modern comfort with the authentic charm and soul of a traditional Mediterranean stone house. It truly feels warm, welcoming, and full of character.\n\nThe location is simply unbeatable – you couldn't wish for a better one. The beach is less than a one-minute walk away, making it incredibly easy to enjoy the crystal-clear sea whenever you like. Everything you need is within easy reach, yet the atmosphere remains peaceful and relaxing.\n\nAbove all, we were impressed by the hospitality of the hosts. They were exceptionally kind, welcoming, and helpful, making us feel at home from the very first moment.\n\nWe highly recommend House Verona to anyone looking for an authentic, comfortable, and unforgettable holiday on the beautiful island of Cres. We would happily return!\n\nHvala domaćinima na prekrasnom boravku – sigurno ćemo se vratiti!"},
  {"name": "Maruša M.", "rating": 5, "source": "Google", "date": "2026", "text": "We had a wonderful one-week stay at this apartment and highly recommend it!\n\nThe location is perfect—just a one-minute walk to a beautiful beach with small pebbles and crystal-clear water. It's also only a few minutes' walk to shops and restaurants, yet the area is very peaceful and quiet, making it the perfect place to relax.\n\nThe apartment is brand new, modern and clean. It has everything you need for a comfortable holiday, and the hosts even provided a baby crib for our child, which we really appreciated.\n\nThe hosts are incredibly kind, welcoming, and always willing to help. They truly go the extra mile to make their guests feel at home.\n\nWe thoroughly enjoyed our stay and would definitely love to come back!"},
  {"name": "Jack", "rating": 5, "source": "Google", "date": "2026", "text": "Wir hatten einen sehr schönen Aufenthalt und können diese Unterkunft nur weiterempfehlen. Die Lage ist hervorragend – das Wasser ist in weniger als einer Minute zu Fuß erreichbar. Gleichzeitig gibt es zahlreiche gute Restaurants in unmittelbarer Nähe.\n\nDie Unterkunft ist modern und dennoch authentisch eingerichtet. Alles wirkt sehr gepflegt und geschmackvoll gestaltet.\n\nAuch die Vermieter waren äußerst freundlich, hilfsbereit und jederzeit erreichbar.\n\nInsgesamt eine 100%ige Empfehlung von uns. Wir würden jederzeit wiederkommen!"},
  // { name: "Ime P.", text: "Tekst recenzije…", rating: 5, source: "Google", date: "kolovoz 2026" },
];

/** Ukupna ocjena na Googleu (nije obavezno). Npr. { rating: 4.9, count: 37 }. Ostavi null ako ne želiš prikazati. */
export const GOOGLE_SUMMARY = { rating: 5.0, count: null };

/** Poveznica na Google profil (sve recenzije) i na obrazac "Ostavi recenziju". */
export const GOOGLE_PROFILE_URL = "https://g.page/r/CVJh7TzP9WhKEAE";
export const GOOGLE_REVIEW_URL = "/recenzija.html";
