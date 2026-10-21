import { cleanPhone, fail, handle, ok, requireOwner, str } from "@/lib/api";
import { releaseSlug, reserveSlug, saveComplejo, slugify } from "@/lib/data";
import { parseHM } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await requireOwner();
  if ("error" in a) return a.error;
  return ok({ complejo: a.complejo });
}

export async function PUT(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const b = await req.json().catch(() => ({}));
    const c = { ...a.complejo };
    c.name = str(b.name, 60);
    c.city = str(b.city, 60);
    c.address = str(b.address, 120);
    const wa = cleanPhone(b.whatsapp);
    const night = parseHM(String(b.nightFrom ?? ""));
    const daysAhead = Number(b.daysAhead);
    const cancelHours = Number(b.cancelHours);
    if (c.name.length < 3) return fail("Poné el nombre del complejo.");
    if (wa.length < 10) return fail("Poné el WhatsApp con código de país y área (ej: 5491155550000).");
    if (night === null) return fail("La hora de tarifa nocturna tiene que ser tipo 19:00.");
    if (!(daysAhead >= 1 && daysAhead <= 60)) return fail("Los días de anticipación van de 1 a 60.");
    if (!(cancelHours >= 0 && cancelHours <= 72)) return fail("Las horas para cancelar van de 0 a 72.");
    c.whatsapp = wa;
    c.nightFrom = night;
    c.daysAhead = Math.round(daysAhead);
    c.cancelHours = Math.round(cancelHours);
    const wantedSlug = slugify(str(b.slug, 40));
    if (wantedSlug && wantedSlug !== c.slug) {
      const got = await reserveSlug(wantedSlug, c.id);
      if (got !== wantedSlug) {
        await releaseSlug(got);
        return fail(`La dirección "${wantedSlug}" ya está en uso. Probá con otra.`, 409);
      }
      await releaseSlug(c.slug);
      c.slug = got;
    }
    await saveComplejo(c);
    return ok({ complejo: c });
  } catch (e) {
    return handle(e);
  }
}
