import { fail, handle, ok, requireOwner } from "@/lib/api";
import { deleteImage, saveComplejo, saveImage } from "@/lib/data";
import { has, planStatus } from "@/lib/plans";
import { DEFAULT_THEME } from "@/lib/theme";

const LIMITS = { logo: 220_000, cover: 480_000 }; // tamaño máximo del data URL (ya comprimido en el navegador)

export async function POST(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const b = await req.json().catch(() => ({}));
    const kind = b.kind === "cover" ? "cover" : b.kind === "logo" ? "logo" : null;
    if (!kind) return fail("Tipo de imagen inválido.");
    const s = planStatus(a.complejo);
    if (kind === "logo" && !has(s, "logo")) return fail("Subir tu logo está incluido desde el plan Club.", 403);
    if (kind === "cover" && !has(s, "portada")) return fail("La foto de portada está incluida en el plan Pro.", 403);
    const data = String(b.dataUrl ?? "");
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data)) return fail("Subí una imagen PNG, JPG o WebP.");
    if (data.length > LIMITS[kind]) return fail("La imagen es muy pesada. Probá con una más chica.");
    await saveImage(a.complejo.id, kind, data);
    const t = { ...DEFAULT_THEME, ...(a.complejo.theme ?? {}) };
    if (kind === "logo") t.logoV = Date.now();
    else t.coverV = Date.now();
    a.complejo.theme = t;
    await saveComplejo(a.complejo);
    return ok({ theme: t });
  } catch (e) {
    return handle(e);
  }
}

export async function DELETE(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const kind = new URL(req.url).searchParams.get("kind") === "cover" ? "cover" : "logo";
    await deleteImage(a.complejo.id, kind);
    const t = { ...DEFAULT_THEME, ...(a.complejo.theme ?? {}) };
    if (kind === "logo") delete t.logoV;
    else {
      delete t.coverV;
      if (t.header === "portada") t.header = "color";
    }
    a.complejo.theme = t;
    await saveComplejo(a.complejo);
    return ok({ theme: t });
  } catch (e) {
    return handle(e);
  }
}
