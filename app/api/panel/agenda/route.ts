import { fail, handle, ok, requireOwner } from "@/lib/api";
import { dayBookings, getCourts, getFijos, visibleCourts } from "@/lib/data";
import { nightFromFor, planStatus } from "@/lib/plans";
import { isValidDate, nowMinutes, todayStr } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const date = new URL(req.url).searchParams.get("date") ?? todayStr();
    if (!isValidDate(date)) return fail("Fecha inválida.");
    const status = planStatus(a.complejo);
    const [allCourts, fijos] = await Promise.all([getCourts(a.complejo.id), getFijos(a.complejo.id)]);
    const courts = visibleCourts(allCourts, status.courts);
    const bookings = await dayBookings(a.complejo.id, date, { courts, fijos, complejo: a.complejo });
    return ok({
      date,
      today: todayStr(),
      now: nowMinutes(),
      courts,
      hiddenCourts: allCourts.length - courts.length,
      bookings,
      nightFrom: nightFromFor(a.complejo, status),
      status: { state: status.state, operating: status.operating, features: status.features, label: status.label },
      whatsappName: a.complejo.name,
    });
  } catch (e) {
    return handle(e);
  }
}
