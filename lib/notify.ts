import { getCourts } from "./data";
import { sendPush } from "./push";
import { fmtLong, hm } from "./time";
import type { Complejo, Reserva } from "./types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Aviso al dueño cuando un jugador reserva o cancela desde la web */
export async function notifyOwner(c: Complejo, r: Pick<Reserva, "id" | "courtId" | "date" | "start" | "name">, kind: "nueva" | "cancelada") {
  try {
    const court = (await getCourts(c.id)).find((k) => k.id === r.courtId);
    const where = `${court?.name ?? "Cancha"} · ${cap(fmtLong(r.date))} · ${hm(r.start)}`;
    await sendPush(c.id, {
      title: kind === "nueva" ? `Nueva reserva · ${r.name}` : `Canceló ${r.name}`,
      body: kind === "nueva" ? where : `Se liberó ${where}`,
      url: `/panel?fecha=${r.date}${kind === "nueva" ? `&turno=${r.id}` : ""}`,
      tag: `${kind}-${r.id}`,
    });
  } catch (e) {
    console.error("[notify]", e);
  }
}
