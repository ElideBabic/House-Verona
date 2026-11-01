/* Povezivanje sa Stripeom, Firebaseom i mailom. Sve tajne dolaze iz Vercel
   Environment Variables (vidi POSTAVLJANJE.md), nikad iz koda. */

import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import nodemailer from "nodemailer";
import { createHmac, timingSafeEqual } from "node:crypto";

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Nedostaje postavka ${name}`);
  return value;
}

/** Adresa stranice za poveznice u mailovima i povratak sa Stripea.
    Na Vercel testnoj (preview) objavi koristi se adresa te grane, pa proba ne vodi na živu stranicu. */
export const SITE_URL = () => {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`;
  }
  return (process.env.SITE_URL || "https://www.house-verona.com").replace(/\/$/, "");
};

let stripe;
export function getStripe() {
  stripe ??= new Stripe(env("STRIPE_SECRET_KEY"));
  return stripe;
}

function firebaseApp() {
  if (getApps().length) return getApps()[0];
  const account = JSON.parse(env("FIREBASE_SERVICE_ACCOUNT"));
  return initializeApp({ credential: cert(account) });
}

export const db = () => getFirestore(firebaseApp());
export const adminAuth = () => getAuth(firebaseApp());

let transport;
function mailer() {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
  });
  return transport;
}

/** Šalje mail; greška se samo zapiše u log da ne sruši rezervaciju. */
export async function sendMail({ to, subject, text, html, replyTo }) {
  try {
    await mailer().sendMail({
      from: process.env.MAIL_FROM || `House Verona <${env("SMTP_USER")}>`,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
      replyTo: replyTo || process.env.ADMIN_EMAIL || undefined,
    });
  } catch (err) {
    console.error("Slanje maila nije uspjelo", to, subject, err);
  }
}

export const adminEmail = () => process.env.ADMIN_EMAIL || env("SMTP_USER");

/** Podaci za uplatu na račun (Vercel → BANK_IBAN, BANK_OWNER, po želji BANK_BIC i BANK_NAME). */
export function bankDetails() {
  const iban = (process.env.BANK_IBAN || "").replace(/\s+/g, "").toUpperCase();
  const owner = (process.env.BANK_OWNER || "").trim();
  if (!iban || !owner) return null;
  return {
    iban: iban.replace(/(.{4})/g, "$1 ").trim(),
    owner,
    bic: (process.env.BANK_BIC || "").trim(),
    bank: (process.env.BANK_NAME || "").trim(),
  };
}

/** Koliko dana gost ima za uplatu nakon potvrde (BANK_DAYS, zadano 5). */
export const bankDays = () => Math.max(1, Number(process.env.BANK_DAYS || 5));

/** Koji su načini plaćanja uključeni — ovisno o tome što je postavljeno u Vercelu. */
export function payMethods() {
  const mail = Boolean(process.env.SMTP_PASS);
  return {
    card: mail && Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    bank: mail && Boolean(bankDetails()),
  };
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

/* Potpisane poveznice "Potvrdi / Odbij" u mailu vlasnici. Potpis se radi tajnim
   ključem (LINK_SECRET, ili CRON_SECRET ako LINK_SECRET nije postavljen), pa
   poveznicu nitko ne može sastaviti sam. Bez ključa mail ima samo link na admin. */
const linkSecret = () => process.env.LINK_SECRET || process.env.CRON_SECRET || "";

function sign(id, action) {
  return createHmac("sha256", linkSecret()).update(`odluka:${id}:${action}`).digest("base64url");
}

export function actionLink(id, action) {
  if (!linkSecret()) return null;
  const q = new URLSearchParams({ id, a: action, t: sign(id, action) });
  return `${SITE_URL()}/api/odluka?${q}`;
}

export function verifyAction(id, action, token) {
  if (!linkSecret() || !id || !action || typeof token !== "string") return false;
  const a = Buffer.from(sign(id, action));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
