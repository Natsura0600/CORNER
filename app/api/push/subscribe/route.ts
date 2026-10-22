import { fail, handle, ok, requireOwner, str } from "@/lib/api";
import { hasSubscription, removeSubscription, saveSubscription } from "@/lib/push";

export const dynamic = "force-dynamic";

const validSub = (s: unknown): s is { endpoint: string; keys: { p256dh: string; auth: string } } => {
  const x = s as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  return typeof x?.endpoint === "string" && x.endpoint.startsWith("https://") && typeof x.keys?.p256dh === "string" && typeof x.keys?.auth === "string";
};

export async function POST(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const b = await req.json().catch(() => ({}));
    if (!validSub(b.subscription)) return fail("Suscripción inválida.");
    await saveSubscription(a.complejo.id, b.subscription, str(b.label, 60) || "Dispositivo");
    return ok();
  } catch (e) {
    return handle(e);
  }
}

/** ¿Este dispositivo ya está registrado? */
export async function PUT(req: Request) {
  const a = await requireOwner();
  if ("error" in a) return a.error;
  const b = await req.json().catch(() => ({}));
  return ok({ active: typeof b.endpoint === "string" && (await hasSubscription(a.complejo.id, b.endpoint)) });
}

export async function DELETE(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const b = await req.json().catch(() => ({}));
    if (typeof b.endpoint === "string") await removeSubscription(a.complejo.id, b.endpoint);
    return ok();
  } catch (e) {
    return handle(e);
  }
}
