import webpush, { type PushSubscription } from "web-push";
import { kv } from "./kv";

/**
 * Notificaciones push (Web Push).
 * Las claves VAPID se generan solas la primera vez y se guardan en la base,
 * así no hace falta configurar nada. Si preferís fijarlas, usá NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.
 */
type Keys = { publicKey: string; privateKey: string };
const KEYS = "push:vapid";
const SUBS = (cid: string) => `push:subs:${cid}`;

let cached: Keys | null = null;
async function vapid(): Promise<Keys> {
  if (cached) return cached;
  const envPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const envPriv = process.env.VAPID_PRIVATE_KEY;
  if (envPub && envPriv) return (cached = { publicKey: envPub, privateKey: envPriv });
  let k = await kv.get<Keys>(KEYS);
  if (!k) {
    await kv.set(KEYS, webpush.generateVAPIDKeys(), { nx: true });
    k = await kv.get<Keys>(KEYS);
  }
  return (cached = k!);
}

export async function publicKey() {
  return (await vapid()).publicKey;
}

function subject() {
  if (process.env.VAPID_SUBJECT) return process.env.VAPID_SUBJECT;
  const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  if (site.startsWith("https://")) return site;
  return `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "soporte@cornerapp.com.ar"}`;
}

async function hash(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

type Stored = { sub: PushSubscription; label: string; at: number };

export async function saveSubscription(cid: string, sub: PushSubscription, label: string) {
  await kv.hset(SUBS(cid), await hash(sub.endpoint), { sub, label: label.slice(0, 60), at: Date.now() } satisfies Stored);
}

export async function removeSubscription(cid: string, endpoint: string) {
  await kv.hdel(SUBS(cid), await hash(endpoint));
}

export async function hasSubscription(cid: string, endpoint: string) {
  return !!(await kv.hget(SUBS(cid), await hash(endpoint)));
}

export type PushPayload = { title: string; body: string; url: string; tag?: string };

/** Manda el aviso a todos los dispositivos del complejo. Borra los que ya no existen. */
export async function sendPush(cid: string, payload: PushPayload) {
  const subs = await kv.hgetall<Stored>(SUBS(cid));
  const entries = Object.entries(subs);
  if (!entries.length) return { sent: 0 };
  const k = await vapid();
  let sent = 0;
  await Promise.all(
    entries.map(async ([field, s]) => {
      try {
        await webpush.sendNotification(s.sub, JSON.stringify(payload), {
          TTL: 60 * 60 * 6,
          urgency: "high",
          vapidDetails: { subject: subject(), publicKey: k.publicKey, privateKey: k.privateKey },
          timeout: 8000,
        });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await kv.hdel(SUBS(cid), field);
        else console.error("[push]", code, (e as Error).message);
      }
    }),
  );
  return { sent };
}
