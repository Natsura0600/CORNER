import { fail, handle, ok, requireSuperadmin, str } from "@/lib/api";
import { getComplejo, getCourts, listComplejos, saveComplejo } from "@/lib/data";
import { planStatus, statusText, trialEnd } from "@/lib/plans";
import type { Complejo, Plan } from "@/lib/types";

export const dynamic = "force-dynamic";
const DAY = 86400000;

function row(c: Complejo, courts: number) {
  const s = planStatus(c);
  return { ...c, courts, status: { state: s.state, text: statusText(s), until: s.until, daysLeft: s.daysLeft, limit: s.courts } };
}

export async function GET() {
  const a = await requireSuperadmin();
  if ("error" in a) return a.error;
  const list = await listComplejos();
  const courts = await Promise.all(list.map((c) => getCourts(c.id)));
  return ok({ complejos: list.map((c, i) => row(c, courts[i].length)) });
}

/** Sumar meses al calendario sin perder el día (31/1 + 1 mes = 28/2 o 29/2) */
function addMonths(from: number, n: number) {
  const d = new Date(from);
  const day = d.getDate();
  d.setMonth(d.getMonth() + n);
  if (d.getDate() !== day) d.setDate(0);
  return d.getTime();
}

export async function PATCH(req: Request) {
  try {
    const a = await requireSuperadmin();
    if ("error" in a) return a.error;
    const b = await req.json().catch(() => ({}));
    const c = await getComplejo(str(b.id, 40));
    if (!c) return fail("Complejo no encontrado.", 404);
    const now = Date.now();

    if (typeof b.active === "boolean") c.active = b.active;

    if (["prueba", "inicial", "club", "pro"].includes(b.plan) && b.plan !== c.plan) {
      const prev = c.plan;
      c.plan = b.plan as Plan;
      // Al pasar de la prueba (o de nada) a un plan pago sin fecha, arranca con 1 mes pago desde hoy
      if (c.plan !== "prueba" && (prev === "prueba" || !c.paidUntil)) c.paidUntil = addMonths(now, 1);
      // Volver a prueba: si ya venció, se le dan 7 días nuevos
      if (c.plan === "prueba" && trialEnd(c) < now) c.trialEnds = now + 7 * DAY;
    }

    // Registrar un pago: suma meses desde hoy o desde el vencimiento actual si todavía no venció
    const months = Number(b.addMonths);
    if (months > 0 && months <= 24) {
      if (c.plan === "prueba") return fail("Primero elegí el plan pago (Inicial, Club o Pro).");
      const base = c.paidUntil && c.paidUntil > now ? c.paidUntil : now;
      c.paidUntil = addMonths(base, months);
    }

    const trialDays = Number(b.addTrialDays);
    if (trialDays > 0 && trialDays <= 60) {
      if (c.plan !== "prueba") return fail("Solo se puede extender la prueba en complejos en prueba.");
      c.trialEnds = Math.max(trialEnd(c), now) + trialDays * DAY;
    }

    if (b.paidUntil === null) c.paidUntil = null;
    else if (typeof b.paidUntil === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.paidUntil)) {
      c.paidUntil = new Date(b.paidUntil + "T23:59:59-03:00").getTime();
    }

    await saveComplejo(c);
    return ok({ complejo: row(c, (await getCourts(c.id)).length) });
  } catch (e) {
    return handle(e);
  }
}
