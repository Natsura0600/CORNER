import { after } from "next/server";
import { fail, handle, ok } from "@/lib/api";
import { notifyOwner } from "@/lib/notify";
import { cancelReserva, findReserva, getCourts } from "@/lib/data";
import { nowMinutes, todayStr } from "@/lib/time";
import type { Complejo, Reserva } from "@/lib/types";

async function load(req: Request, id: string) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const found = await findReserva(id);
  if (!found || !t || found.reserva.token !== t) return null;
  return found;
}

function hoursUntil(r: Reserva) {
  const today = todayStr();
  const days = Math.round((Date.parse(r.date + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000);
  return (days * 1440 + r.start - nowMinutes()) / 60;
}

function canCancel(r: Reserva, c: Complejo) {
  return hoursUntil(r) >= c.cancelHours;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const f = await load(req, id);
    if (!f) return fail("No encontramos esa reserva.", 404);
    const { reserva: r, complejo: c } = f;
    const court = (await getCourts(c.id)).find((x) => x.id === r.courtId);
    return ok({
      reserva: { id: r.id, date: r.date, start: r.start, dur: r.dur, name: r.name, price: r.price },
      court: court ? { name: court.name, sport: court.sport } : null,
      complejo: { name: c.name, slug: c.slug, address: c.address, city: c.city, whatsapp: c.whatsapp, cancelHours: c.cancelHours },
      canCancel: canCancel(r, c),
      past: hoursUntil(r) < 0,
    });
  } catch (e) {
    return handle(e);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const f = await load(req, id);
    if (!f) return fail("No encontramos esa reserva.", 404);
    if (!canCancel(f.reserva, f.complejo)) return fail(`Las cancelaciones online se aceptan hasta ${f.complejo.cancelHours} h antes. Escribile al complejo.`, 409);
    await cancelReserva(f.complejo.id, f.reserva.date, f.reserva.id);
    after(() => notifyOwner(f.complejo, f.reserva, "cancelada"));
    return ok();
  } catch (e) {
    return handle(e);
  }
}
