import { cleanPhone, fail, handle, ok, str } from "@/lib/api";
import { createReserva, getComplejoBySlug } from "@/lib/data";
import { isValidDate } from "@/lib/time";

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const c = await getComplejoBySlug(str(b.slug, 60));
    if (!c || !c.active) return fail("Complejo no encontrado.", 404);
    const name = str(b.name, 60);
    const phone = cleanPhone(b.phone);
    const date = String(b.date ?? "");
    const start = Number(b.start);
    if (name.length < 3) return fail("Poné tu nombre y apellido.");
    if (phone.length < 10) return fail("Poné tu WhatsApp con código de área (ej: 11 5555 0000).");
    if (!isValidDate(date) || !Number.isInteger(start)) return fail("Elegí un horario válido.");
    const r = await createReserva(c, { courtId: str(b.courtId, 40), date, start, name, phone, origin: "web" });
    return ok({ id: r.id, token: r.token });
  } catch (e) {
    return handle(e);
  }
}
