import { kv } from "./kv";
import { addDays, dayOfWeek, nowMinutes, todayStr } from "./time";
import type { Booking, Complejo, Court, Fijo, Reserva, User } from "./types";

// ---------- claves ----------
const K = {
  user: (email: string) => `user:${email}`,
  complejo: (id: string) => `complejo:${id}`,
  slug: (slug: string) => `slug:${slug}`,
  complejos: () => `complejos`,
  courts: (cid: string) => `courts:${cid}`,
  fijos: (cid: string) => `fijos:${cid}`,
  day: (cid: string, date: string) => `res:${cid}:${date}`,
  skip: (cid: string, date: string) => `fskip:${cid}:${date}`,
  lock: (cid: string, courtId: string, date: string, start: number) => `lock:${cid}:${courtId}:${date}:${start}`,
  rid: (id: string) => `rid:${id}`,
  ver: (cid: string) => `ver:${cid}`,
  last: (cid: string) => `last:${cid}`,
};

// ---------- cambios en vivo ----------
/** Última reserva online, para avisarle al dueño en el panel */
export type LastBooking = { id: string; date: string; start: number; courtId: string; name: string; at: number };

/** Marca que algo cambió en la agenda del complejo (1 comando). El panel lo consulta para refrescarse. */
export async function touch(cid: string) {
  await kv.set(K.ver(cid), String(Date.now()) + Math.floor(Math.random() * 1000), { ex: 60 * 60 * 24 * 30 });
}

/** Lee versión y última reserva en un solo comando (MGET). */
export async function getLive(cid: string) {
  const [v, last] = await kv.mget<unknown>([K.ver(cid), K.last(cid)]);
  return { v: v == null ? "0" : String(v), last: (last as LastBooking | null) ?? null };
}

export function newId(prefix: string) {
  const rnd = crypto.getRandomValues(new Uint8Array(9));
  return prefix + "_" + Array.from(rnd, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 14);
}

export function newToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "complejo"
  );
}

// ---------- usuarios ----------
export const getUser = (email: string) => kv.get<User>(K.user(email.toLowerCase()));
export async function createUser(u: User) {
  return kv.set(K.user(u.email.toLowerCase()), u, { nx: true });
}
export const saveUser = (u: User) => kv.set(K.user(u.email.toLowerCase()), u);

// ---------- complejos ----------
export const getComplejo = (id: string) => kv.get<Complejo>(K.complejo(id));

export async function getComplejoBySlug(slug: string) {
  const id = await kv.get<string>(K.slug(slug));
  return id ? getComplejo(String(id)) : null;
}

export async function listComplejos(): Promise<Complejo[]> {
  const ids = await kv.smembers(K.complejos());
  const all = await kv.mget<Complejo>(ids.map((i) => K.complejo(i)));
  return all.filter((c): c is Complejo => !!c).sort((a, b) => b.createdAt - a.createdAt);
}

export async function reserveSlug(base: string, id: string) {
  let slug = slugify(base);
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    if (await kv.set(K.slug(candidate), id, { nx: true })) return candidate;
  }
  slug = `${slug}-${id.slice(-5)}`;
  await kv.set(K.slug(slug), id);
  return slug;
}

export async function releaseSlug(slug: string) {
  await kv.del(K.slug(slug));
}

export async function saveComplejo(c: Complejo) {
  await kv.set(K.complejo(c.id), c);
  await kv.sadd(K.complejos(), c.id);
}

// ---------- canchas ----------
export async function getCourts(cid: string): Promise<Court[]> {
  return (await kv.get<Court[]>(K.courts(cid))) ?? [];
}
export const saveCourts = (cid: string, courts: Court[]) => kv.set(K.courts(cid), courts);

export function slotsOf(c: Court): number[] {
  const out: number[] = [];
  for (let t = c.open; t + c.dur <= c.close; t += c.dur) out.push(t);
  return out;
}

export function priceOf(c: Court, start: number, nightFrom: number) {
  return start >= nightFrom ? c.priceNight : c.priceDay;
}

// ---------- turnos fijos ----------
export async function getFijos(cid: string): Promise<Fijo[]> {
  return (await kv.get<Fijo[]>(K.fijos(cid))) ?? [];
}
export const saveFijos = (cid: string, f: Fijo[]) => kv.set(K.fijos(cid), f);

// ---------- turnos de un día ----------
export async function dayBookings(cid: string, date: string, ctx?: { courts?: Court[]; fijos?: Fijo[]; complejo?: Complejo }): Promise<Booking[]> {
  const [res, fijos, skips, courts, complejo] = await Promise.all([
    kv.hgetall<Reserva>(K.day(cid, date)),
    ctx?.fijos ?? getFijos(cid),
    kv.smembers(K.skip(cid, date)),
    ctx?.courts ?? getCourts(cid),
    ctx?.complejo ?? getComplejo(cid),
  ]);
  const nightFrom = complejo?.nightFrom ?? 19 * 60;
  const out: Booking[] = Object.values(res).map((r) => ({
    id: r.id,
    courtId: r.courtId,
    start: r.start,
    dur: r.dur,
    name: r.name,
    phone: r.phone,
    origin: r.origin,
    price: r.price,
  }));
  const dow = dayOfWeek(date);
  for (const f of fijos) {
    if (f.dow !== dow || date < f.since || skips.includes(f.id)) continue;
    const court = courts.find((c) => c.id === f.courtId);
    if (!court) continue;
    out.push({ id: f.id, courtId: f.courtId, start: f.start, dur: f.dur, name: f.name, phone: f.phone, origin: "fijo", price: priceOf(court, f.start, nightFrom) });
  }
  return out.sort((a, b) => a.start - b.start);
}

export function overlaps(bookings: Booking[], courtId: string, start: number, dur: number) {
  return bookings.some((b) => b.courtId === courtId && b.start < start + dur && start < b.start + b.dur);
}

export class BookingError extends Error {}

/** Valida que la fecha esté dentro del rango que se puede reservar y que el horario no haya pasado. */
export function checkWindow(c: Complejo, date: string, start: number, allowFar = false) {
  const today = todayStr();
  if (date < today) throw new BookingError("Esa fecha ya pasó.");
  if (!allowFar && date > addDays(today, c.daysAhead)) throw new BookingError(`Solo se puede reservar hasta ${c.daysAhead} días antes.`);
  if (date === today && start <= nowMinutes()) throw new BookingError("Ese horario ya pasó.");
}

/**
 * Crea una reserva evitando la doble reserva:
 * 1) toma un candado atómico (SET NX) sobre cancha + día + hora,
 * 2) revisa que no se pise con otros turnos (incluidos los fijos),
 * 3) guarda la reserva.
 */
export async function createReserva(
  complejo: Complejo,
  input: { courtId: string; date: string; start: number; name: string; phone: string; origin: Reserva["origin"] },
  opts: { staff?: boolean } = {},
): Promise<Reserva> {
  const courts = await getCourts(complejo.id);
  const court = courts.find((c) => c.id === input.courtId);
  if (!court) throw new BookingError("La cancha no existe.");
  if (!slotsOf(court).includes(input.start)) throw new BookingError("Ese horario no está disponible para esta cancha.");
  checkWindow(complejo, input.date, input.start, opts.staff);

  const lockKey = K.lock(complejo.id, court.id, input.date, input.start);
  const id = newId("r");
  const ok = await kv.set(lockKey, id, { nx: true, ex: 60 * 60 * 24 * 120 });
  if (!ok) throw new BookingError("Ese turno se acaba de ocupar. Elegí otro horario.");

  try {
    const existing = await dayBookings(complejo.id, input.date, { courts, complejo });
    if (overlaps(existing, court.id, input.start, court.dur)) throw new BookingError("Ese turno ya está ocupado. Elegí otro horario.");
    const r: Reserva = {
      id,
      courtId: court.id,
      date: input.date,
      start: input.start,
      dur: court.dur,
      name: input.name,
      phone: input.phone,
      origin: input.origin,
      price: input.origin === "bloqueo" ? 0 : priceOf(court, input.start, complejo.nightFrom),
      token: newToken(),
      createdAt: Date.now(),
    };
    await kv.hset(K.day(complejo.id, input.date), id, r);
    if (r.origin === "web") {
      const last: LastBooking = { id, date: r.date, start: r.start, courtId: r.courtId, name: r.name, at: Date.now() };
      await kv.set(K.last(complejo.id), last, { ex: 60 * 60 * 24 });
    }
    await touch(complejo.id);
    await kv.set(K.rid(id), { cid: complejo.id, date: input.date }, { ex: 60 * 60 * 24 * 400 });
    return r;
  } catch (e) {
    await kv.del(lockKey);
    throw e;
  }
}

export async function findReserva(id: string): Promise<{ reserva: Reserva; complejo: Complejo } | null> {
  const ref = await kv.get<{ cid: string; date: string }>(K.rid(id));
  if (!ref) return null;
  const [reserva, complejo] = await Promise.all([kv.hget<Reserva>(K.day(ref.cid, ref.date), id), getComplejo(ref.cid)]);
  if (!reserva || !complejo) return null;
  return { reserva, complejo };
}

export async function cancelReserva(cid: string, date: string, id: string) {
  const r = await kv.hget<Reserva>(K.day(cid, date), id);
  if (!r) return false;
  await kv.hdel(K.day(cid, date), id);
  await kv.del(K.lock(cid, r.courtId, date, r.start), K.rid(id));
  await touch(cid);
  return true;
}

/** Libera un turno fijo solo para una fecha puntual (ej: avisaron que no vienen). */
export async function skipFijo(cid: string, date: string, fijoId: string) {
  await kv.sadd(K.skip(cid, date), fijoId);
  await touch(cid);
}

export async function addFijo(complejo: Complejo, input: { courtId: string; date: string; start: number; name: string; phone: string }) {
  const courts = await getCourts(complejo.id);
  const court = courts.find((c) => c.id === input.courtId);
  if (!court) throw new BookingError("La cancha no existe.");
  if (!slotsOf(court).includes(input.start)) throw new BookingError("Ese horario no corresponde a los turnos de esta cancha.");
  const fijos = await getFijos(complejo.id);
  const dow = dayOfWeek(input.date);
  if (fijos.some((f) => f.courtId === court.id && f.dow === dow && f.start < input.start + court.dur && input.start < f.start + f.dur)) {
    throw new BookingError("Ya hay un turno fijo en ese día y horario.");
  }
  // Revisa choques con reservas ya tomadas en las próximas semanas
  for (let w = 0; w * 7 <= complejo.daysAhead + 7; w++) {
    const d = addDays(input.date, w * 7);
    const res = await kv.hgetall<Reserva>(K.day(complejo.id, d));
    const clash = Object.values(res).find((r) => r.courtId === court.id && r.start < input.start + court.dur && input.start < r.start + r.dur);
    if (clash) throw new BookingError(`El ${d.split("-").reverse().join("/")} ese horario ya está reservado por ${clash.name}. Liberalo primero.`);
  }
  const f: Fijo = {
    id: newId("f"),
    courtId: court.id,
    dow,
    start: input.start,
    dur: court.dur,
    name: input.name,
    phone: input.phone,
    since: input.date,
    createdAt: Date.now(),
  };
  fijos.push(f);
  await saveFijos(complejo.id, fijos);
  await touch(complejo.id);
  return f;
}

export async function removeFijo(cid: string, fijoId: string) {
  const fijos = await getFijos(cid);
  await saveFijos(
    cid,
    fijos.filter((f) => f.id !== fijoId),
  );
  await touch(cid);
}

export async function countBookingsRange(cid: string, from: string, days: number) {
  let n = 0;
  for (let i = 0; i < days; i++) n += (await dayBookings(cid, addDays(from, i))).filter((b) => b.origin !== "bloqueo").length;
  return n;
}
