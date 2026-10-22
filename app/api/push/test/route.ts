import { handle, ok, requireOwner } from "@/lib/api";
import { sendPush } from "@/lib/push";

export async function POST() {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    const r = await sendPush(a.complejo.id, { title: "Córner · Aviso de prueba", body: "Así te van a llegar las reservas nuevas de " + a.complejo.name + ".", url: "/panel", tag: "prueba" });
    return ok(r);
  } catch (e) {
    return handle(e);
  }
}
