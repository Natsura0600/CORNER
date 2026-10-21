import { cleanPhone, fail, handle, ok, requireOwner, str } from "@/lib/api";
import { addFijo, cancelReserva, createReserva, removeFijo, skipFijo } from "@/lib/data";
import { isValidDate } from "@/lib/time";

export async function POST(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const b = await req.json().catch(() => ({}));
    const type = String(b.type);
    const date = String(b.date ?? "");
    const start = Number(b.start);
    const name = str(b.name, 60);
    const phone = cleanPhone(b.phone);
    const courtId = str(b.courtId, 40);
    if (!isValidDate(date) || !Number.isInteger(start)) return fail("Elegí día y horario.");
    if (!name) return fail(type === "bloqueo" ? "Poné el motivo del bloqueo." : "Poné un nombre para identificar el turno.");
    if (type === "fijo") {
      const f = await addFijo(a.complejo, { courtId, date, start, name, phone });
      return ok({ id: f.id });
    }
    if (type !== "manual" && type !== "bloqueo") return fail("Tipo de turno inválido.");
    const r = await createReserva(a.complejo, { courtId, date, start, name, phone, origin: type }, { staff: true });
    return ok({ id: r.id });
  } catch (e) {
    return handle(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const b = await req.json().catch(() => ({}));
    const id = str(b.id, 40);
    const date = String(b.date ?? "");
    if (!isValidDate(date)) return fail("Fecha inválida.");
    if (b.origin === "fijo") {
      if (b.scope === "siempre") await removeFijo(a.complejo.id, id);
      else await skipFijo(a.complejo.id, date, id);
      return ok();
    }
    const done = await cancelReserva(a.complejo.id, date, id);
    if (!done) return fail("Ese turno ya no existe.", 404);
    return ok();
  } catch (e) {
    return handle(e);
  }
}
