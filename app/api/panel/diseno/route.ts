import { fail, handle, ok, requireOwner, str } from "@/lib/api";
import { saveComplejo } from "@/lib/data";
import { has, planStatus } from "@/lib/plans";
import { DEFAULT_THEME, FONTS, HEADERS, igHandle, isHex } from "@/lib/theme";
import type { FontChoice, HeaderStyle } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await requireOwner();
  if ("error" in a) return a.error;
  const s = planStatus(a.complejo);
  return ok({ theme: { ...DEFAULT_THEME, ...(a.complejo.theme ?? {}) }, features: s.features, plan: s.label, slug: a.complejo.slug, name: a.complejo.name, cid: a.complejo.id });
}

export async function PUT(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const s = planStatus(a.complejo);
    const b = await req.json().catch(() => ({}));
    const t = { ...DEFAULT_THEME, ...(a.complejo.theme ?? {}) };
    if (!isHex(b.accent)) return fail("Elegí un color válido.");
    t.accent = b.accent.toLowerCase();
    t.description = str(b.description, 280);
    t.instagram = igHandle(String(b.instagram ?? ""));
    if (b.header in HEADERS) {
      const f = HEADERS[b.header as HeaderStyle].feature;
      if (f && !has(s, f)) return fail(`El encabezado "${HEADERS[b.header as HeaderStyle].label}" está incluido en un plan más alto.`);
      t.header = b.header;
    }
    if (b.font in FONTS) {
      if (b.font !== "deportiva" && !has(s, "portada")) return fail("Cambiar la tipografía está incluido en el plan Pro.");
      t.font = b.font as FontChoice;
    }
    a.complejo.theme = t;
    await saveComplejo(a.complejo);
    return ok({ theme: t });
  } catch (e) {
    return handle(e);
  }
}
