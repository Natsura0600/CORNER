import { fail, handle, ok, requireSuperadmin, str } from "@/lib/api";
import { getComplejo, getCourts, listComplejos, saveComplejo } from "@/lib/data";
import type { Plan } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await requireSuperadmin();
  if ("error" in a) return a.error;
  const list = await listComplejos();
  const courts = await Promise.all(list.map((c) => getCourts(c.id)));
  return ok({ complejos: list.map((c, i) => ({ ...c, courts: courts[i].length })) });
}

export async function PATCH(req: Request) {
  try {
    const a = await requireSuperadmin();
    if ("error" in a) return a.error;
    const b = await req.json().catch(() => ({}));
    const c = await getComplejo(str(b.id, 40));
    if (!c) return fail("Complejo no encontrado.", 404);
    if (typeof b.active === "boolean") c.active = b.active;
    if (["prueba", "inicial", "club", "pro"].includes(b.plan)) c.plan = b.plan as Plan;
    await saveComplejo(c);
    return ok({ complejo: c });
  } catch (e) {
    return handle(e);
  }
}
