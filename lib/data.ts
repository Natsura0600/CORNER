import { revalidateTag } from "next/cache";
import { kv } from "./kv";
import { addDays, dayOfWeek, nowMinutes, todayStr } from "./time";
import type { Booking, Complejo, Court, Fijo, Reserva, Sport, User } from "./types";
import { nightFromFor, planStatus } from "./plans";

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
export type LastBooking = { id: string; date: string; start: number; courtId: string; name: string; phone: string; at: number };

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
export const deleteUser = (email: string) => kv.del(K.user(email.toLowerCase()));

/** Valida que la sesión siga vigente (mismo usuario, mismo complejo y misma versión) */
export async function sessionUser(s: { email: string; cid?: string; sv?: number }) {
  const u = await getUser(s.email);
  if (!u || !s.cid || u.complejoId !== s.cid || (u.sv ?? 0) !== (s.sv ?? 0)) return null;
  return u;
}

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
  await syncDir(c);
}

// ---------- directorio (buscador de canchas) ----------
/**
 * Ficha compacta de cada complejo para el buscador. Están todas en un solo hash,
 * así el buscador lee 1 comando aunque haya cientos de complejos.
 */
export type DirEntry = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  active: boolean;
  plan: Complejo["plan"];
  trialEnds?: number;
  paidUntil?: number | null;
  createdAt: number;
  nightFrom: number;
  sports: Sport[]; // deporte de cada cancha, en orden
  logoV?: number;
  accent?: string;
};
const DIR = "dir";
const DIR_READY = "dir:ready";

function toEntry(c: Complejo, courts: Court[]): DirEntry {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    city: c.city,
    address: c.address,
    active: c.active,
    plan: c.plan,
    trialEnds: c.trialEnds,
    paidUntil: c.paidUntil ?? null,
    createdAt: c.createdAt,
    nightFrom: c.nightFrom,
    sports: courts.map((k) => k.sport),
    logoV: c.theme?.logoV,
    accent: c.theme?.accent,
  };
}

function refreshDirCache() {
  try {
    revalidateTag("directorio");
  } catch {
    // fuera de un pedido (scripts) no hay caché que limpiar
  }
}

async function syncDir(c: Complejo, courts?: Court[]) {
  await kv.hset(DIR, c.id, toEntry(c, courts ?? (await getCourts(c.id))));
  refreshDirCache();
}

/** Lee el directorio completo. La primera vez (o si se borró) lo arma a partir de los complejos existentes. */
export async function readDirectory(): Promise<DirEntry[]> {
  const ready = await kv.get<string>(DIR_READY);
  if (!ready) {
    const all = await listComplejos();
    const courts = await Promise.all(all.map((c) => getCourts(c.id)));
    await Promise.all(all.map((c, i) => kv.hset(DIR, c.id, toEntry(c, courts[i]))));
    await kv.set(DIR_READY, "1");
  }
  return Object.values(await kv.hgetall<DirEntry>(DIR));
}

// ---------- canchas ----------
export async function getCourts(cid: string): Promise<Court[]> {
  return (await kv.get<Court[]>(K.courts(cid))) ?? [];
}
export async function saveCourts(cid: string, courts: Court[]) {
  await kv.set(K.courts(cid), courts);
  const c = await getComplejo(cid);
  if (c) await syncDir(c, courts);
}

/** Canchas habilitadas según el límite del plan (las primeras N, en el orden en que las cargó el dueño) */
export function visibleCourts(courts: Court[], limit: number) {
  return courts.slice(0, limit);
}

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
  const nightFrom = complejo ? nightFromFor(complejo) : 19 * 60;
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
  const status = planStatus(complejo);
  if (!status.operating) throw new BookingError(opts.staff ? "Tu plan no está activo. Renovalo para seguir cargando turnos." : "Este complejo no está tomando reservas online por ahora.");
  const courts = visibleCourts(await getCourts(complejo.id), status.courts);
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
      price: input.origin === "bloqueo" ? 0 : priceOf(court, input.start, nightFromFor(complejo, status)),
      token: newToken(),
      createdAt: Date.now(),
    };
    await kv.hset(K.day(complejo.id, input.date), id, r);
    if (r.origin === "web") {
      const last: LastBooking = { id, date: r.date, start: r.start, courtId: r.courtId, name: r.name, phone: r.phone, at: Date.now() };
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

/** Revisa que un turno fijo entre en ese día de la semana y horario (contra otros fijos y reservas de las próximas semanas) */
async function checkFijoSlot(complejo: Complejo, fijos: Fijo[], court: Court, dow: number, start: number, from: string, excludeId?: string) {
  if (!slotsOf(court).includes(start)) throw new BookingError("Ese horario no corresponde a los turnos de esta cancha.");
  if (fijos.some((f) => f.id !== excludeId && f.courtId === court.id && f.dow === dow && f.start < start + court.dur && start < f.start + f.dur)) {
    throw new BookingError("Ya hay un turno fijo en ese día y horario.");
  }
  for (let w = 0; w * 7 <= complejo.daysAhead + 7; w++) {
    const d = addDays(from, w * 7);
    const res = await kv.hgetall<Reserva>(K.day(complejo.id, d));
    const clash = Object.values(res).find((r) => r.courtId === court.id && r.start < start + court.dur && start < r.start + r.dur);
    if (clash) throw new BookingError(`El ${d.split("-").reverse().join("/")} ese horario ya está reservado por ${clash.name}. Liberalo primero.`);
  }
}

async function operatingCourts(complejo: Complejo) {
  const status = planStatus(complejo);
  if (!status.operating) throw new BookingError("Tu plan no está activo. Renovalo para seguir cargando turnos.");
  return { status, courts: visibleCourts(await getCourts(complejo.id), status.courts) };
}

export async function addFijo(complejo: Complejo, input: { courtId: string; date: string; start: number; name: string; phone: string }) {
  const { courts } = await operatingCourts(complejo);
  const court = courts.find((c) => c.id === input.courtId);
  if (!court) throw new BookingError("La cancha no existe.");
  const fijos = await getFijos(complejo.id);
  const dow = dayOfWeek(input.date);
  await checkFijoSlot(complejo, fijos, court, dow, input.start, input.date);
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

export type MoveTo = { courtId: string; date: string; start: number; name: string; phone: string };

/**
 * Edita una reserva: cambia nombre/WhatsApp y, si hace falta, la mueve de cancha, día u horario.
 * Mantiene el mismo id y token, así el link del jugador sigue funcionando.
 */
export async function updateReserva(complejo: Complejo, date: string, id: string, to: MoveTo): Promise<Reserva> {
  const { status, courts } = await operatingCourts(complejo);
  const r = await kv.hget<Reserva>(K.day(complejo.id, date), id);
  if (!r) throw new BookingError("Ese turno ya no existe.");
  const court = courts.find((c) => c.id === to.courtId);
  if (!court) throw new BookingError("La cancha no existe.");
  const moved = r.courtId !== court.id || r.date !== to.date || r.start !== to.start;
  const next: Reserva = {
    ...r,
    name: to.name,
    phone: to.phone,
    courtId: court.id,
    date: to.date,
    start: to.start,
    dur: moved ? court.dur : r.dur,
    price: moved && r.origin !== "bloqueo" ? priceOf(court, to.start, nightFromFor(complejo, status)) : r.price,
  };
  if (!moved) {
    await kv.hset(K.day(complejo.id, date), id, next);
    await touch(complejo.id);
    return next;
  }
  if (!slotsOf(court).includes(to.start)) throw new BookingError("Ese horario no está disponible para esta cancha.");
  checkWindow(complejo, to.date, to.start, true);
  const newLock = K.lock(complejo.id, court.id, to.date, to.start);
  const oldLock = K.lock(complejo.id, r.courtId, r.date, r.start);
  const gotLock = await kv.set(newLock, id, { nx: true, ex: 60 * 60 * 24 * 120 });
  // Si el candado nuevo ya es de este mismo turno (caso raro), lo dejamos pasar
  if (!gotLock && (await kv.get<string>(newLock)) !== id) throw new BookingError("Ese horario se acaba de ocupar. Elegí otro.");
  try {
    const existing = (await dayBookings(complejo.id, to.date, { courts, complejo })).filter((b) => b.id !== id);
    if (overlaps(existing, court.id, to.start, court.dur)) throw new BookingError("Ese horario ya está ocupado. Elegí otro.");
    if (to.date !== date) {
      await kv.hset(K.day(complejo.id, to.date), id, next);
      await kv.hdel(K.day(complejo.id, date), id);
      await kv.set(K.rid(id), { cid: complejo.id, date: to.date }, { ex: 60 * 60 * 24 * 400 });
    } else {
      await kv.hset(K.day(complejo.id, date), id, next);
    }
    if (oldLock !== newLock) await kv.del(oldLock);
    await touch(complejo.id);
    return next;
  } catch (e) {
    if (oldLock !== newLock) await kv.del(newLock);
    throw e;
  }
}

/** Edita un turno fijo para todas las semanas (desde la fecha elegida si cambia de día u horario) */
export async function updateFijo(complejo: Complejo, fijoId: string, to: MoveTo) {
  const { courts } = await operatingCourts(complejo);
  const fijos = await getFijos(complejo.id);
  const f = fijos.find((x) => x.id === fijoId);
  if (!f) throw new BookingError("Ese turno fijo ya no existe.");
  const court = courts.find((c) => c.id === to.courtId);
  if (!court) throw new BookingError("La cancha no existe.");
  const dow = dayOfWeek(to.date);
  const moved = f.courtId !== court.id || f.dow !== dow || f.start !== to.start;
  if (moved) await checkFijoSlot(complejo, fijos, court, dow, to.start, to.date, f.id);
  Object.assign(f, { name: to.name, phone: to.phone });
  if (moved) Object.assign(f, { courtId: court.id, dow, start: to.start, dur: court.dur, since: to.date > f.since ? to.date : f.since });
  await saveFijos(complejo.id, fijos);
  await touch(complejo.id);
  return f;
}

/** Mueve un turno fijo solo por una fecha: libera ese día y crea una reserva manual en el lugar nuevo */
export async function moveFijoOnce(complejo: Complejo, date: string, fijoId: string, to: MoveTo) {
  await kv.sadd(K.skip(complejo.id, date), fijoId);
  try {
    return await createReserva(complejo, { ...to, origin: "manual" }, { staff: true });
  } catch (e) {
    await kv.srem(K.skip(complejo.id, date), fijoId);
    throw e;
  }
}

export async function removeFijo(cid: string, fijoId: string) {
  const fijos = await getFijos(cid);
  await saveFijos(
    cid,
    fijos.filter((f) => f.id !== fijoId),
  );
  await touch(cid);
}

/** Turnos de un rango de fechas (para exportar). Máximo 93 días. */
export async function rangeBookings(cid: string, from: string, to: string) {
  const out: { date: string; b: Booking }[] = [];
  const [courts, fijos, complejo] = await Promise.all([getCourts(cid), getFijos(cid), getComplejo(cid)]);
  for (let d = from, i = 0; d <= to && i < 93; d = addDays(d, 1), i++) {
    for (const b of await dayBookings(cid, d, { courts, fijos, complejo: complejo ?? undefined })) out.push({ date: d, b });
  }
  return { rows: out, courts };
}

// ---------- imágenes del complejo (logo y portada) ----------
const IMG = (cid: string, kind: "logo" | "cover") => `img:${cid}:${kind}`;
export const getImage = (cid: string, kind: "logo" | "cover") => kv.get<string>(IMG(cid, kind));
export const saveImage = (cid: string, kind: "logo" | "cover", dataUrl: string) => kv.set(IMG(cid, kind), dataUrl);
export const deleteImage = (cid: string, kind: "logo" | "cover") => kv.del(IMG(cid, kind));

// ---------- borrar un complejo (superadmin) ----------
/**
 * Borra un complejo y todo lo suyo: cuenta del dueño, canchas, turnos fijos, reservas,
 * imágenes, avisos y su lugar en el buscador. No se puede deshacer.
 */
export async function deleteComplejo(cid: string) {
  const c = await getComplejo(cid);
  if (!c) return false;
  // Ids de reservas, para borrar también sus links (rid:)
  const dayKeys = await kv.keys(`res:${cid}:`);
  const rids: string[] = [];
  for (const k of dayKeys) rids.push(...Object.keys(await kv.hgetall(k)).map((id) => K.rid(id)));
  const extra = [...(await kv.keys(`lock:${cid}:`)), ...(await kv.keys(`fskip:${cid}:`))];
  const user = await getUser(c.ownerEmail);
  const all = [
    K.complejo(cid),
    K.courts(cid),
    K.fijos(cid),
    K.ver(cid),
    K.last(cid),
    IMG(cid, "logo"),
    IMG(cid, "cover"),
    `push:subs:${cid}`,
    ...dayKeys,
    ...rids,
    ...extra,
  ];
  // Solo borra el slug y la cuenta si siguen siendo de este complejo
  if ((await kv.get<string>(K.slug(c.slug))) === cid) all.push(K.slug(c.slug));
  if (user && user.complejoId === cid) all.push(K.user(c.ownerEmail.toLowerCase()));
  for (let i = 0; i < all.length; i += 200) await kv.del(...all.slice(i, i + 200));
  await kv.srem(K.complejos(), cid);
  await kv.hdel(DIR, cid);
  refreshDirCache();
  return true;
}
