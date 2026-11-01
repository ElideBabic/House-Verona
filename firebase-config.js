/* Firebase postavke — upiši vrijednosti iz svog Firebase projekta.
   Upute: POSTAVLJANJE.md

   Ove vrijednosti NISU tajne i smiju biti javne — Firebase ih tako i objavljuje.
   Sigurnost se ne oslanja na njih nego na Firestore pravila (firestore.rules),
   koja pisanje dopuštaju isključivo računu s ADMIN_UID vrijednošću niže. */

export const firebaseConfig = {
  apiKey: "AIzaSyBbKs9RABzJ1Bv02B_2Vis3Whg5nMk8wt8",
  authDomain: "house-verona.firebaseapp.com",
  projectId: "house-verona",
  appId: "1:618436943416:web:45ad22e243edd2a98350cd",
};

/** UID Google računa koji jedini smije uređivati kalendar. */
export const ADMIN_UID = "";

export const isConfigured = () =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
