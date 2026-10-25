import { runReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Tarea diaria (vercel.json → crons). Vercel la llama con el header
 * "Authorization: Bearer <CRON_SECRET>" cuando la variable CRON_SECRET está cargada.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  const r = await runReminders();
  console.log("[cron vencimientos]", JSON.stringify(r));
  return Response.json(r);
}
