export const TZ = "America/Argentina/Buenos_Aires";

/** Fecha de hoy en Argentina, formato YYYY-MM-DD */
export function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Minutos transcurridos del día en Argentina */
export function nowMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

const asDate = (d: string) => new Date(d + "T12:00:00Z");

export function addDays(date: string, n: number): string {
  const d = asDate(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dayOfWeek(date: string): number {
  return asDate(date).getUTCDay();
}

export function isValidDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(asDate(s).getTime());
}

export function hm(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseHM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 24 || mi > 59 || (h === 24 && mi > 0)) return null;
  return h * 60 + mi;
}

export function fmtLong(date: string): string {
  return asDate(date).toLocaleDateString("es-AR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
}

export function fmtDow(date: string): string {
  return asDate(date).toLocaleDateString("es-AR", { timeZone: "UTC", weekday: "short" }).replace(".", "");
}

export function dayNum(date: string): number {
  return asDate(date).getUTCDate();
}

export const DOW_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
