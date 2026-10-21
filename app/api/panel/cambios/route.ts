import { getSession } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { getLive } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Consulta liviana para el panel: devuelve si cambió la agenda y la última reserva online.
 * Usa la sesión firmada (sin leer la base) + 1 solo comando a Upstash.
 */
export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "owner" || !s.cid) return fail("Tenés que iniciar sesión.", 401);
  return ok(await getLive(s.cid));
}
