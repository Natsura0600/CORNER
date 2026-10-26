import { fail, handle, ok, requireOwner, str } from "@/lib/api";
import { has, planStatus } from "@/lib/plans";
import { getCourts, getFijos, newId, saveCourts, saveFijos, touch } from "@/lib/data";
import { SPORTS, type Court, type Sport } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await requireOwner();
  if ("error" in a) return a.error;
  const s = planStatus(a.complejo);
  return ok({ courts: await getCourts(a.complejo.id), nightFrom: a.complejo.nightFrom, limit: s.courts, nocturna: has(s, "nocturna"), plan: s.label });
}

export async function PUT(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const b = await req.json().catch(() => ({}));
    if (!Array.isArray(b.courts)) return fail("Datos inválidos.");
    const st = planStatus(a.complejo);
    const limit = st.courts;
    if (b.courts.length > limit) return fail(`Tu plan ${st.label} permite ${limit === 1 ? "1 cancha" : `hasta ${limit} canchas`}. Quitá ${b.courts.length - limit} o pasate a un plan más grande.`);
    const prev = await getCourts(a.complejo.id);
    const courts: Court[] = [];
    for (const [i, raw] of (b.courts as Record<string, unknown>[]).entries()) {
      const n = i + 1;
      const name = str(raw.name, 40);
      const sport = String(raw.sport) as Sport;
      const dur = Number(raw.dur);
      const open = Number(raw.open);
      const close = Number(raw.close);
      const priceDay = Math.round(Number(raw.priceDay));
      const priceNight = Math.round(Number(raw.priceNight));
      if (!name) return fail(`Ponele nombre a la cancha ${n}.`);
      if (!(sport in SPORTS)) return fail(`Elegí el deporte de "${name}".`);
      if (![30, 45, 60, 75, 90, 120].includes(dur)) return fail(`La duración del turno de "${name}" no es válida.`);
      if (!(open >= 0 && close <= 1440 && close - open >= dur)) return fail(`Revisá el horario de "${name}": tiene que entrar al menos un turno.`);
      if (!(priceDay >= 0 && priceNight >= 0)) return fail(`Revisá los precios de "${name}".`);
      const id = typeof raw.id === "string" && prev.some((p) => p.id === raw.id) ? raw.id : newId("k");
      courts.push({ id, name, sport, detail: str(raw.detail, 60), dur, open, close, priceDay, priceNight });
    }
    await saveCourts(a.complejo.id, courts);
    await touch(a.complejo.id);
    // Los turnos fijos de canchas eliminadas o cuyo horario ya no encaja se quitan
    const fijos = await getFijos(a.complejo.id);
    const kept = fijos.filter((f) => {
      const c = courts.find((x) => x.id === f.courtId);
      return c && c.dur === f.dur && f.start >= c.open && f.start + f.dur <= c.close && (f.start - c.open) % c.dur === 0;
    });
    if (kept.length !== fijos.length) await saveFijos(a.complejo.id, kept);
    return ok({ courts, removedFijos: fijos.length - kept.length });
  } catch (e) {
    return handle(e);
  }
}
