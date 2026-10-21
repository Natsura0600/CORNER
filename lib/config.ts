import type { Plan } from "./types";

export const BRAND = "Córner";

/** WhatsApp comercial de Córner (solo números). Se configura con NEXT_PUBLIC_CONTACT_WHATSAPP. */
export const CONTACT_WHATSAPP = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "").replace(/\D/g, "");

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

/** Planes que se muestran en la landing. Editá precios y límites acá. */
export const PLANS: { id: Exclude<Plan, "prueba">; name: string; monthly: number; courts: string; features: string[]; featured?: boolean }[] = [
  {
    id: "inicial",
    name: "Inicial",
    monthly: 25000,
    courts: "Hasta 3 canchas",
    features: ["Página de reservas propia", "Agenda online", "Turnos fijos semanales", "Bloqueos por lluvia o mantenimiento"],
  },
  {
    id: "club",
    name: "Club",
    monthly: 40000,
    courts: "Hasta 8 canchas",
    features: ["Todo lo del plan Inicial", "Tarifa diurna y nocturna", "Estadísticas de ocupación", "Soporte por WhatsApp"],
    featured: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 60000,
    courts: "Canchas ilimitadas",
    features: ["Todo lo del plan Club", "Varias sedes", "Prioridad en nuevas funciones", "Acompañamiento en la puesta en marcha"],
  },
];

/** Descuento del pago anual (0.2 = 20%) */
export const ANNUAL_DISCOUNT = 0.2;

export const TRIAL_DAYS = 14;

export const PLAN_LABEL: Record<Plan, string> = { prueba: "Prueba", inicial: "Inicial", club: "Club", pro: "Pro" };

export const COURT_LIMIT: Record<Plan, number> = { prueba: 8, inicial: 3, club: 8, pro: 999 };

export function waLink(number: string, text?: string) {
  const n = number.replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const money = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
