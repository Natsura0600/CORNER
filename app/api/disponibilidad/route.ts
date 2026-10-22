import { fail, handle, ok } from "@/lib/api";
import { dayBookings, getComplejoBySlug, getCourts, getFijos, overlaps, priceOf, slotsOf, visibleCourts } from "@/lib/data";
import { nightFromFor, planStatus } from "@/lib/plans";
import { addDays, isValidDate, nowMinutes, todayStr } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const slug = u.searchParams.get("slug") ?? "";
    const date = u.searchParams.get("date") ?? "";
    if (!isValidDate(date)) return fail("Fecha inválida.");
    const c = await getComplejoBySlug(slug);
    if (!c) return fail("Complejo no encontrado.", 404);
    const status = planStatus(c);
    if (!status.operating) return fail("Este complejo no está tomando reservas online por ahora.", 403);
    const nightFrom = nightFromFor(c, status);
    const today = todayStr();
    if (date < today || date > addDays(today, c.daysAhead)) return fail("Fecha fuera del rango de reservas.");
    const [allCourts, fijos] = await Promise.all([getCourts(c.id), getFijos(c.id)]);
    const courts = visibleCourts(allCourts, status.courts);
    const bookings = await dayBookings(c.id, date, { courts, fijos, complejo: c });
    const now = date === today ? nowMinutes() : -1;
    // No se exponen nombres ni teléfonos: solo si el turno está libre u ocupado.
    return ok({
      date,
      courts: courts.map((ct) => ({
        id: ct.id,
        name: ct.name,
        sport: ct.sport,
        detail: ct.detail,
        dur: ct.dur,
        slots: slotsOf(ct).map((t) => ({
          start: t,
          price: priceOf(ct, t, nightFrom),
          night: t >= nightFrom,
          state: t <= now ? "pasado" : overlaps(bookings, ct.id, t, ct.dur) ? "ocupado" : "libre",
        })),
      })),
    });
  } catch (e) {
    return handle(e);
  }
}
