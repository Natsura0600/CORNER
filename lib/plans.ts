import type { Complejo, Plan } from "./types";

/** Días de la prueba gratis */
export const TRIAL_DAYS = 14;
/** Días de gracia después de que vence un plan pago, antes de cortar las reservas */
export const GRACE_DAYS = 3;

export type Feature = "nocturna" | "estadisticas" | "logo" | "portada" | "exportar";

/** Qué incluye cada plan. Esta tabla es la que se aplica de verdad en todo el sistema. */
export const PLAN_DEF: Record<Plan, { label: string; courts: number; features: Feature[] }> = {
  prueba: { label: "Prueba gratis", courts: 8, features: ["nocturna", "estadisticas", "logo", "portada", "exportar"] },
  inicial: { label: "Inicial", courts: 1, features: [] },
  club: { label: "Club", courts: 2, features: ["nocturna", "estadisticas", "logo"] },
  pro: { label: "Pro", courts: 999, features: ["nocturna", "estadisticas", "logo", "portada", "exportar"] },
};

export const FEATURE_PLAN: Record<Feature, string> = {
  nocturna: "Club",
  estadisticas: "Club",
  logo: "Club",
  portada: "Pro",
  exportar: "Pro",
};

export type PlanState = "prueba" | "activo" | "vencido" | "suspendido";

export type Status = {
  state: PlanState;
  plan: Plan;
  label: string;
  /** Hasta cuándo rige (fin de prueba o pagado hasta) */
  until: number | null;
  daysLeft: number | null;
  /** Puede recibir reservas y cargar turnos */
  operating: boolean;
  courts: number;
  features: Feature[];
};

const DAY = 86400000;

export function trialEnd(c: Complejo) {
  return c.trialEnds ?? c.createdAt + TRIAL_DAYS * DAY;
}

export function planStatus(c: Complejo, now = Date.now()): Status {
  const def = PLAN_DEF[c.plan] ?? PLAN_DEF.inicial;
  let state: PlanState;
  let until: number | null = null;
  if (!c.active) state = "suspendido";
  else if (c.plan === "prueba") {
    until = trialEnd(c);
    state = now > until ? "vencido" : "prueba";
  } else {
    until = c.paidUntil ?? null;
    state = until && now > until + GRACE_DAYS * DAY ? "vencido" : "activo";
  }
  const operating = state === "prueba" || state === "activo";
  return {
    state,
    plan: c.plan,
    label: def.label,
    until,
    daysLeft: until ? Math.ceil((until - now) / DAY) : null,
    operating,
    courts: def.courts,
    features: operating ? def.features : [],
  };
}

export const has = (s: Status, f: Feature) => s.features.includes(f);

/** Hora desde la que rige la tarifa nocturna (si el plan no la incluye, nunca rige) */
export function nightFromFor(c: Complejo, s = planStatus(c)) {
  return has(s, "nocturna") ? c.nightFrom : 24 * 60 + 1;
}

export function statusText(s: Status) {
  const d = (t: number) => new Date(t).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "America/Argentina/Buenos_Aires" });
  switch (s.state) {
    case "prueba":
      return `Prueba gratis · ${s.daysLeft === 1 ? "queda 1 día" : `quedan ${s.daysLeft} días`}`;
    case "activo":
      return s.until ? `${s.label} · ${s.until < Date.now() ? "venció el" : "hasta el"} ${d(s.until)}` : `${s.label} · activo`;
    case "vencido":
      return s.plan === "prueba" ? "Prueba vencida" : `${s.label} · vencido`;
    case "suspendido":
      return "Suspendido";
  }
}
