import type { Feature } from "./plans";
import type { FontChoice, HeaderStyle, Theme } from "./types";

export const ACCENTS = [
  { name: "Césped", hex: "#1f7a46" },
  { name: "Pádel", hex: "#1e5aa0" },
  { name: "Polvo de ladrillo", hex: "#c0532a" },
  { name: "Bandera", hex: "#e3402a" },
  { name: "Noche", hex: "#16181c" },
  { name: "Violeta", hex: "#5b3fbf" },
  { name: "Naranja", hex: "#e07b12" },
  { name: "Turquesa", hex: "#0e8a8a" },
];

export const FONTS: Record<FontChoice, { label: string; stack: string; stretch: string; weight: number }> = {
  deportiva: { label: "Deportiva", stack: '"Archivo Variable", "Archivo", system-ui, sans-serif', stretch: "112%", weight: 800 },
  clasica: { label: "Clásica", stack: '"Fraunces Variable", Georgia, serif', stretch: "100%", weight: 700 },
  redonda: { label: "Redonda", stack: '"Nunito Variable", system-ui, sans-serif', stretch: "100%", weight: 800 },
};

export const HEADERS: Record<HeaderStyle, { label: string; feature?: Feature }> = {
  liso: { label: "Liso" },
  color: { label: "A color", feature: "logo" },
  portada: { label: "Con foto de portada", feature: "portada" },
};

export const DEFAULT_THEME: Theme = { accent: "#1f7a46", header: "liso", font: "deportiva", description: "", instagram: "" };

export const isHex = (s: unknown): s is string => typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s);

/** Blanco o negro, lo que se lea mejor sobre el color */
export function onColor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  return L > 0.36 ? "#0e0f0e" : "#ffffff";
}

/** Aplica lo que permite el plan: si bajó de plan, vuelve a las opciones incluidas */
export function effectiveTheme(t: Theme | undefined, features: Feature[]): Theme & { showLogo: boolean; showCover: boolean } {
  const th = { ...DEFAULT_THEME, ...(t ?? {}) };
  const can = (f?: Feature) => !f || features.includes(f);
  let header = th.header;
  if (!can(HEADERS[header].feature) || (header === "portada" && !th.coverV)) header = can("logo") && header !== "liso" ? "color" : "liso";
  const font = can("portada") ? th.font : "deportiva";
  return { ...th, header, font, showLogo: can("logo") && !!th.logoV, showCover: header === "portada" && !!th.coverV };
}

export function igHandle(s: string) {
  return s.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "").slice(0, 40);
}
