import type { Plan } from "./types";

export const BRAND = "Córner";

/** WhatsApp comercial de Córner (solo números). Se configura con NEXT_PUBLIC_CONTACT_WHATSAPP. */
export const CONTACT_WHATSAPP = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "").replace(/\D/g, "");

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

/** Planes que se muestran en la landing. Editá precios y límites acá. */
export const PLANS: { id: Exclude<Plan, "prueba">; name: string; monthly: number; courts: string; pitch: string; features: string[]; featured?: boolean }[] = [
  {
    id: "inicial",
    name: "Inicial",
    monthly: 25000,
    courts: "Hasta 3 canchas",
    pitch: "Para arrancar con lo esencial.",
    features: ["Página de reservas propia", "Agenda en vivo con avisos", "Turnos fijos y bloqueos", "Color y descripción de tu página"],
  },
  {
    id: "club",
    name: "Club",
    monthly: 40000,
    courts: "Hasta 8 canchas",
    pitch: "Para el complejo que trabaja todos los días.",
    features: ["Todo lo del plan Inicial", "Tarifa diurna y nocturna", "Estadísticas del día", "Tu logo y encabezado a color"],
    featured: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 60000,
    courts: "Canchas ilimitadas",
    pitch: "Para los que tienen muchas canchas.",
    features: ["Todo lo del plan Club", "Foto de portada y tipografía", "Exportar reservas a Excel", "Soporte prioritario y puesta en marcha"],
  },
];

/** Tabla comparativa de la landing. true/false o un texto. Mantenela alineada con PLAN_DEF en lib/plans.ts */
export const COMPARE: { label: string; values: [boolean | string, boolean | string, boolean | string] }[] = [
  { label: "Canchas", values: ["Hasta 3", "Hasta 8", "Ilimitadas"] },
  { label: "Página de reservas propia", values: [true, true, true] },
  { label: "Agenda en vivo con avisos y sonido", values: [true, true, true] },
  { label: "Turnos fijos semanales y bloqueos", values: [true, true, true] },
  { label: "Botón de WhatsApp en cada reserva", values: [true, true, true] },
  { label: "Color y descripción de tu página", values: [true, true, true] },
  { label: "Tarifa diurna y nocturna", values: [false, true, true] },
  { label: "Estadísticas de ocupación y facturación", values: [false, true, true] },
  { label: "Tu logo y encabezado a color", values: [false, true, true] },
  { label: "Foto de portada y tipografía a elección", values: [false, false, true] },
  { label: "Exportar reservas a Excel", values: [false, false, true] },
  { label: "Soporte", values: ["WhatsApp", "WhatsApp", "Prioritario + puesta en marcha"] },
];

/** Descuento del pago anual (0.2 = 20%) */
export const ANNUAL_DISCOUNT = 0.2;

export { TRIAL_DAYS } from "./plans";

export const PLAN_LABEL: Record<Plan, string> = { prueba: "Prueba", inicial: "Inicial", club: "Club", pro: "Pro" };

/** Email de contacto para temas legales y de datos (opcional) */
/** Casilla de soporte que se muestra en el sitio, el panel, los legales y los mails. Se puede cambiar con NEXT_PUBLIC_CONTACT_EMAIL. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "soporte@cornerapp.com.ar";

/** Datos del titular que aparecen en Términos y Privacidad. Completalos antes de publicar. */
export const LEGAL = {
  owner: process.env.NEXT_PUBLIC_LEGAL_OWNER ?? "Córner",
  city: process.env.NEXT_PUBLIC_LEGAL_CITY ?? "la Provincia de Buenos Aires",
  updated: "21 de octubre de 2026",
};

/** Pasa un teléfono argentino como lo escribe la gente (11 5555 0000, 011 15...) al formato de WhatsApp (54911...) */
export function toWa(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("54")) return d;
  if (d.startsWith("0")) d = d.slice(1);
  return "549" + d;
}

export function waLink(number: string, text?: string) {
  const n = number.replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const money = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
