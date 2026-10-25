import { kv } from "./kv";
import { listComplejos } from "./data";
import { expiryMail, sendMail, type Reminder } from "./mail";
import { trialEnd } from "./plans";
import { TZ } from "./time";

const DAY = 86400000;

const ymd = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(t));
/** Días de calendario (hora de Argentina) entre hoy y la fecha de vencimiento: 0 = hoy, 1 = mañana */
const calendarDays = (from: number, to: number) => Math.round((Date.parse(ymd(to) + "T12:00:00Z") - Date.parse(ymd(from) + "T12:00:00Z")) / DAY);

/** Días antes del vencimiento en que se manda el primer aviso */
export const REMIND_DAYS_BEFORE = 3;

export type ReminderResult = { revisados: number; enviados: { complejo: string; tipo: Reminder; ok: boolean; error?: string }[] };

/**
 * Revisa todos los complejos y manda los avisos que correspondan.
 * Cada aviso se manda una sola vez por vencimiento (si se renueva, la fecha cambia y vuelve a avisar).
 */
export async function runReminders(now = Date.now()): Promise<ReminderResult> {
  const list = await listComplejos();
  const out: ReminderResult = { revisados: list.length, enviados: [] };

  for (const c of list) {
    if (!c.active || !c.ownerEmail) continue;
    const trial = c.plan === "prueba";
    const until = trial ? trialEnd(c) : c.paidUntil ?? null;
    if (!until) continue;

    const daysLeft = calendarDays(now, until);
    let kind: Reminder | null = null;
    if (until > now && daysLeft <= REMIND_DAYS_BEFORE) kind = "pronto";
    // "vencido" solo dentro de la semana del vencimiento, para no mandarles a cuentas viejas abandonadas
    else if (until <= now && now - until < 7 * DAY) kind = "vencido";
    if (!kind) continue;

    const key = `mailsent:${c.id}:${until}:${kind}`;
    const fresh = await kv.set(key, now, { nx: true, ex: 60 * 60 * 24 * 120 });
    if (!fresh) continue;

    const r = await sendMail(expiryMail(c, kind, until, daysLeft));
    if (!r.ok) await kv.del(key); // si falló, se reintenta en la próxima pasada
    out.enviados.push({ complejo: c.name, tipo: kind, ok: r.ok, ...(r.ok ? {} : { error: r.error }) });
  }
  return out;
}
