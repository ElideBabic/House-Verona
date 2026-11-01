/* Firebase postavke — upiši vrijednosti iz svog Firebase projekta.
   Upute: POSTAVLJANJE.md

   Ove vrijednosti NISU tajne i smiju biti javne — Firebase ih tako i objavljuje.
   Sigurnost se ne oslanja na njih nego na Firestore pravila (firestore.rules),
   koja pisanje dopuštaju isključivo računima s popisa ADMIN_UIDS niže. */

export const firebaseConfig = {
  apiKey: "AIzaSyBbKs9RABzJ1Bv02B_2Vis3Whg5nMk8wt8",
  authDomain: "house-verona.firebaseapp.com",
  projectId: "house-verona",
  appId: "1:618436943416:web:45ad22e243edd2a98350cd",
};

/** UID-ovi Google računa koji smiju u admin (uređivanje kalendara, potvrde).
    Isti popis mora biti u firestore.rules i u Vercel varijabli ADMIN_UID (odvojeni zarezom). */
export const ADMIN_UIDS = [
  "9lS4aRecbLdOMX5Npn27KuCYfLH3", // house.verona.cres@gmail.com
  "zNjquEvSvQbsIllqMspJ6EJMy8L2", // Elidin osobni Gmail
];
export const ADMIN_UID = ADMIN_UIDS[0];

export const isConfigured = () =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
