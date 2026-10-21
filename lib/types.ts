export type Sport = "futbol5" | "futbol7" | "futbol11" | "padel" | "tenis";

export const SPORTS: Record<Sport, { label: string; short: string; group: "futbol" | "padel" | "tenis"; dur: number }> = {
  futbol5: { label: "Fútbol 5", short: "F5", group: "futbol", dur: 60 },
  futbol7: { label: "Fútbol 7", short: "F7", group: "futbol", dur: 60 },
  futbol11: { label: "Fútbol 11", short: "F11", group: "futbol", dur: 90 },
  padel: { label: "Pádel", short: "Pádel", group: "padel", dur: 90 },
  tenis: { label: "Tenis", short: "Tenis", group: "tenis", dur: 60 },
};

export type Court = {
  id: string;
  name: string;
  sport: Sport;
  detail: string; // ej: "Sintético · techada"
  dur: number; // minutos por turno
  open: number; // minuto del día en que arranca el primer turno
  close: number; // minuto del día en que termina el último turno (hasta 1440)
  priceDay: number;
  priceNight: number;
};

export type Plan = "prueba" | "inicial" | "club" | "pro";

export type Complejo = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  whatsapp: string; // solo números, con código de país
  nightFrom: number; // minuto desde el que rige la tarifa nocturna
  daysAhead: number; // cuántos días hacia adelante se puede reservar
  cancelHours: number; // horas mínimas de anticipación para cancelar online
  active: boolean;
  plan: Plan;
  ownerEmail: string;
  createdAt: number;
};

export type Origin = "web" | "manual" | "bloqueo" | "fijo";

export type Reserva = {
  id: string;
  courtId: string;
  date: string;
  start: number;
  dur: number;
  name: string;
  phone: string;
  origin: Exclude<Origin, "fijo">;
  price: number;
  token: string;
  createdAt: number;
};

export type Fijo = {
  id: string;
  courtId: string;
  dow: number; // 0 = domingo
  start: number;
  dur: number;
  name: string;
  phone: string;
  since: string; // YYYY-MM-DD desde cuándo rige
  createdAt: number;
};

/** Turno ya resuelto para un día (reserva o turno fijo) */
export type Booking = {
  id: string;
  courtId: string;
  start: number;
  dur: number;
  name: string;
  phone: string;
  origin: Origin;
  price: number;
};

export type User = {
  email: string;
  passHash: string;
  complejoId: string;
  createdAt: number;
};

export type Session = { email: string; role: "owner" | "superadmin"; cid?: string };
