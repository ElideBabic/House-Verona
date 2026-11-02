/* Cjenik iz admina: Firestore dokument settings/prices { seasons: [{ from, to, night }] }.
   Ako dokument ne postoji ili nije ispravan, ostaje zadani cjenik iz cijene.js. */

import { db } from "./servisi.js";
import { setSeasons, DEFAULT_SEASONS, SEASONS } from "../../cijene.js";

const CACHE_MS = 30_000;
let loadedAt = 0;

/** Učitaj cjenik iz Firestorea u SEASONS (s kratkim cacheom). Vraća trenutni SEASONS. */
export async function loadSeasons({ fresh = false } = {}) {
  if (!fresh && Date.now() - loadedAt < CACHE_MS) return SEASONS;
  try {
    const snap = await db().collection("settings").doc("prices").get();
    const saved = snap.exists ? snap.data().seasons : null;
    if (!saved || !setSeasons(saved)) setSeasons(DEFAULT_SEASONS);
    loadedAt = Date.now();
  } catch (err) {
    // Bez Firestorea ostaje zadnji poznati cjenik (na početku zadani).
    console.error("Cjenik:", err);
  }
  return SEASONS;
}
