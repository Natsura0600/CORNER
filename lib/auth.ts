import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Session } from "./types";

const COOKIE = "corner_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("Falta AUTH_SECRET en las variables de entorno.");
    return new TextEncoder().encode("solo-para-desarrollo-local-cambiar");
  }
  return new TextEncoder().encode(s);
}

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { email: String(payload.email), role: payload.role === "superadmin" ? "superadmin" : "owner", cid: payload.cid ? String(payload.cid) : undefined, sv: Number(payload.sv ?? 0) };
  } catch {
    return null;
  }
}

export function isSuperadmin(email: string, password: string) {
  const e = process.env.SUPERADMIN_EMAIL?.toLowerCase();
  const p = process.env.SUPERADMIN_PASSWORD;
  return !!e && !!p && email.toLowerCase() === e && password === p;
}
