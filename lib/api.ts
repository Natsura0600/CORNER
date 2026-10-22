import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { BookingError, getComplejo, sessionUser } from "./data";

export const ok = (data: unknown = { ok: true }) => NextResponse.json(data);
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function requireOwner() {
  const s = await getSession();
  if (!s || s.role !== "owner" || !s.cid) return { error: fail("Tenés que iniciar sesión.", 401) } as const;
  const [user, complejo] = await Promise.all([sessionUser(s), getComplejo(s.cid)]);
  if (!user) return { error: fail("Tu sesión venció. Volvé a iniciar sesión.", 401) } as const;
  if (!complejo) return { error: fail("No encontramos tu complejo.", 404) } as const;
  return { session: s, complejo, user } as const;
}

export async function requireSuperadmin() {
  const s = await getSession();
  if (!s || s.role !== "superadmin") return { error: fail("No autorizado.", 401) } as const;
  return { session: s } as const;
}

export function handle(e: unknown) {
  if (e instanceof BookingError) return fail(e.message, 409);
  console.error(e);
  return fail("Algo salió mal. Probá de nuevo en un momento.", 500);
}

export const cleanPhone = (s: unknown) => String(s ?? "").replace(/\D/g, "");
export const str = (s: unknown, max = 120) => String(s ?? "").trim().slice(0, max);
