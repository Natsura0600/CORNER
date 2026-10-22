import { fail, handle, requireOwner } from "@/lib/api";
import { rangeBookings } from "@/lib/data";
import { has, planStatus } from "@/lib/plans";
import { hm, isValidDate } from "@/lib/time";
import { SPORTS } from "@/lib/types";

export const dynamic = "force-dynamic";

const ORIGIN = { web: "Web", manual: "Manual", fijo: "Turno fijo", bloqueo: "Bloqueo" } as const;
const cell = (v: string | number) => {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Exporta los turnos de un rango a CSV (se abre en Excel). Solo plan Pro o prueba. */
export async function GET(req: Request) {
  try {
    const a = await requireOwner();
    if ("error" in a) return a.error;
    if (!has(planStatus(a.complejo), "exportar")) return fail("Exportar a Excel está incluido en el plan Pro.", 403);
    const u = new URL(req.url);
    const from = u.searchParams.get("desde") ?? "";
    const to = u.searchParams.get("hasta") ?? "";
    if (!isValidDate(from) || !isValidDate(to) || to < from) return fail("Revisá las fechas.");
    const { rows, courts } = await rangeBookings(a.complejo.id, from, to);
    const head = ["Fecha", "Desde", "Hasta", "Cancha", "Deporte", "Nombre", "WhatsApp", "Tipo", "Precio"];
    const lines = rows.map(({ date, b }) => {
      const c = courts.find((x) => x.id === b.courtId);
      return [date.split("-").reverse().join("/"), hm(b.start), hm(b.start + b.dur), c?.name ?? "", c ? SPORTS[c.sport].label : "", b.name, b.phone, ORIGIN[b.origin], b.origin === "bloqueo" ? 0 : b.price];
    });
    // Separador ; y BOM para que Excel en español lo abra bien
    const csv = "﻿" + [head, ...lines].map((r) => r.map(cell).join(";")).join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="turnos-${a.complejo.slug}-${from}-a-${to}.csv"`,
      },
    });
  } catch (e) {
    return handle(e);
  }
}
