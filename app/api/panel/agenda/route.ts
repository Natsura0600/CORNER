import { fail, handle, ok, requireOwner } from "@/lib/api";
import { dayBookings, getCourts, getFijos } from "@/lib/data";
import { isValidDate, nowMinutes, todayStr } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const date = new URL(req.url).searchParams.get("date") ?? todayStr();
    if (!isValidDate(date)) return fail("Fecha inválida.");
    const [courts, fijos] = await Promise.all([getCourts(a.complejo.id), getFijos(a.complejo.id)]);
    const bookings = await dayBookings(a.complejo.id, date, { courts, fijos, complejo: a.complejo });
    return ok({ date, today: todayStr(), now: nowMinutes(), courts, bookings, nightFrom: a.complejo.nightFrom });
  } catch (e) {
    return handle(e);
  }
}
