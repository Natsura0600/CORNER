import { CONTACT_WHATSAPP, PLAN_LABEL, waLink } from "./config";
import { GRACE_DAYS, TRIAL_DAYS } from "./plans";
import type { Complejo } from "./types";

/**
 * Mails con Resend (https://resend.com), usando su API directa.
 * Variables:
 *   RESEND_API_KEY        clave de Resend
 *   MAIL_FROM             remitente, ej: "Córner <hola@cornerapp.com.ar>"
 *   ADMIN_NOTIFY_EMAIL    a quién avisar cuando se registra un complejo (si falta, usa SUPERADMIN_EMAIL)
 * Sin RESEND_API_KEY los mails no se mandan: solo se anotan en el log (útil para probar en local).
 */

export const mailConfigured = () => !!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM;

export function siteUrl() {
  const u =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return u.replace(/\/+$/, "");
}

export function adminEmail() {
  return (process.env.ADMIN_NOTIFY_EMAIL || process.env.SUPERADMIN_EMAIL || "").trim();
}

type Mail = { to: string; subject: string; html: string; text: string };

export async function sendMail(m: Mail): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  if (!m.to) return { ok: false, error: "Falta el destinatario." };
  if (!mailConfigured()) {
    console.log(`[mail] (sin RESEND_API_KEY, no se envía) → ${m.to}: ${m.subject}`);
    return { ok: false, error: "Faltan las variables RESEND_API_KEY y MAIL_FROM." };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [m.to],
        subject: m.subject,
        html: m.html,
        text: m.text,
        ...(adminEmail() ? { reply_to: adminEmail() } : {}),
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!r.ok) {
      console.error("[mail]", r.status, j.message);
      return { ok: false, error: j.message || `Resend respondió ${r.status}` };
    }
    return { ok: true, id: j.id };
  } catch (e) {
    console.error("[mail]", e);
    return { ok: false, error: (e as Error).message };
  }
}

// ---------- diseño del mail ----------
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const fecha = (t: number) =>
  new Date(t).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "long", day: "numeric", month: "long" });

/** Arma un mail simple con la marca: título, párrafos, botón y pie. Los textos ya vienen escapados. */
function layout(opts: { preheader: string; title: string; paragraphs: string[]; button?: { label: string; url: string }; footer?: string }) {
  const site = siteUrl();
  const p = opts.paragraphs.map((x) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.55;color:#3a3c39">${x}</p>`).join("");
  const btn = opts.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 22px"><tr><td style="background:#0e0f0e;border-radius:999px"><a href="${opts.button.url}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${opts.button.label}</a></td></tr></table>`
    : "";
  const wa = CONTACT_WHATSAPP ? ` · <a href="${waLink(CONTACT_WHATSAPP)}" style="color:#6a6c68">WhatsApp</a>` : "";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${opts.title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e3e3df;border-radius:16px">
<tr><td style="padding:26px 30px 6px"><img src="${site}/marca/corner-logo-800px.png" width="132" alt="Córner" style="display:block;width:132px;height:auto;border:0"></td></tr>
<tr><td style="padding:16px 30px 8px">
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.15;color:#0e0f0e;letter-spacing:-0.02em">${opts.title}</h1>
${p}${btn}
${opts.footer ? `<p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#6a6c68">${opts.footer}</p>` : ""}
</td></tr>
<tr><td style="padding:18px 30px 24px;border-top:1px solid #e3e3df;font-size:12px;color:#6a6c68">Córner · Turnos online para canchas · <a href="${site}" style="color:#6a6c68">${site.replace(/^https?:\/\//, "")}</a>${wa}</td></tr>
</table></td></tr></table></body></html>`;
}

const plain = (lines: (string | false | undefined)[]) => lines.filter(Boolean).join("\n\n");

// ---------- mails ----------

export function welcomeMail(c: Complejo): Mail {
  const site = siteUrl();
  const page = `${site}/c/${c.slug}`;
  const name = esc(c.name);
  return {
    to: c.ownerEmail,
    subject: `¡Bienvenido a Córner, ${c.name}!`,
    html: layout({
      preheader: `Tu prueba gratis de ${TRIAL_DAYS} días ya empezó.`,
      title: `¡Bienvenido a Córner!`,
      paragraphs: [
        `Ya creaste la cuenta de <b>${name}</b>. Tu prueba gratis de ${TRIAL_DAYS} días empezó hoy y termina el <b>${fecha(c.trialEnds ?? c.createdAt + TRIAL_DAYS * 86400000)}</b>.`,
        `Para empezar a recibir reservas:`,
        `1. Cargá tus canchas con su horario y precios.<br>2. Compartí tu link de reservas en Instagram y WhatsApp.<br>3. Instalá el panel en tu celular y activá los avisos para enterarte de cada reserva.`,
        `Tu link de reservas es:<br><a href="${page}" style="color:#0e0f0e;font-weight:600">${esc(page.replace(/^https?:\/\//, ""))}</a>`,
      ],
      button: { label: "Cargar mis canchas", url: `${site}/panel/canchas` },
      footer: "Cualquier duda, respondé este mail y te ayudamos.",
    }),
    text: plain([
      `¡Bienvenido a Córner!`,
      `Ya creaste la cuenta de ${c.name}. Tu prueba gratis de ${TRIAL_DAYS} días termina el ${fecha(c.trialEnds ?? c.createdAt + TRIAL_DAYS * 86400000)}.`,
      `1. Cargá tus canchas: ${site}/panel/canchas\n2. Compartí tu link de reservas: ${page}\n3. Instalá el panel en tu celular y activá los avisos.`,
      `Cualquier duda, respondé este mail.`,
    ]),
  };
}

export function newSignupAdminMail(c: Complejo): Mail {
  const site = siteUrl();
  const name = esc(c.name);
  return {
    to: adminEmail(),
    subject: `Nuevo complejo en Córner: ${c.name} (${c.city})`,
    html: layout({
      preheader: `${c.name} empezó su prueba gratis.`,
      title: "Nuevo complejo registrado",
      paragraphs: [
        `<b>${name}</b> de ${esc(c.city)} creó su cuenta y empezó la prueba gratis.`,
        `Email: ${esc(c.ownerEmail)}<br>WhatsApp: <a href="${waLink(c.whatsapp)}" style="color:#0e0f0e">+${esc(c.whatsapp)}</a><br>Página: <a href="${site}/c/${c.slug}" style="color:#0e0f0e">/c/${esc(c.slug)}</a>`,
      ],
      button: { label: "Ver en el superadmin", url: `${site}/admin` },
    }),
    text: plain([`Nuevo complejo: ${c.name} (${c.city})`, `Email: ${c.ownerEmail}`, `WhatsApp: +${c.whatsapp}`, `Página: ${site}/c/${c.slug}`, `Superadmin: ${site}/admin`]),
  };
}

export type Reminder = "pronto" | "vencido";

/** Aviso de vencimiento: unos días antes ("pronto") o cuando ya venció ("vencido") */
export function expiryMail(c: Complejo, kind: Reminder, until: number, daysLeft: number): Mail {
  const site = siteUrl();
  const trial = c.plan === "prueba";
  const name = esc(c.name);
  const what = trial ? "tu prueba gratis" : `tu plan ${PLAN_LABEL[c.plan]}`;
  const renewUrl = CONTACT_WHATSAPP
    ? waLink(CONTACT_WHATSAPP, `Hola! Quiero ${trial ? "contratar un plan" : "renovar mi plan"} de Córner para ${c.name}.`)
    : `${site}/panel/ajustes`;
  const renewLabel = trial ? "Elegir mi plan" : "Renovar mi plan";
  const when = daysLeft <= 0 ? "hoy" : daysLeft === 1 ? "mañana" : `en ${daysLeft} días`;

  if (kind === "pronto") {
    return {
      to: c.ownerEmail,
      subject: trial ? `Tu prueba gratis de Córner termina ${when}` : `Tu plan de Córner vence ${when}`,
      html: layout({
        preheader: `${trial ? "Tu prueba" : "Tu plan"} termina el ${fecha(until)}.`,
        title: trial ? `Tu prueba gratis termina ${when}` : `Tu plan vence ${when}`,
        paragraphs: [
          `Te avisamos que ${what} de <b>${name}</b> termina el <b>${fecha(until)}</b>.`,
          trial
            ? `Para que tu página siga tomando reservas, elegí un plan antes de esa fecha. Tus canchas, turnos y diseño quedan como están.`
            : `Para que tu página siga tomando reservas sin cortes, renovalo antes de esa fecha.`,
        ],
        button: { label: renewLabel, url: renewUrl },
        footer: "Si ya lo hiciste, ignorá este mail.",
      }),
      text: plain([
        trial ? `Tu prueba gratis de Córner termina ${when}.` : `Tu plan de Córner vence ${when}.`,
        `${cap(what)} de ${c.name} termina el ${fecha(until)}.`,
        `${renewLabel}: ${renewUrl}`,
        `Si ya lo hiciste, ignorá este mail.`,
      ]),
    };
  }

  // vencido
  const cut = trial ? until : until + GRACE_DAYS * 86400000;
  const inGrace = !trial && Date.now() < cut;
  return {
    to: c.ownerEmail,
    subject: trial ? "Tu prueba gratis de Córner terminó" : inGrace ? "Tu plan de Córner venció" : "Tu página de Córner dejó de tomar reservas",
    html: layout({
      preheader: inGrace ? `Tenés hasta el ${fecha(cut)} para renovar.` : "Elegí un plan para volver a tomar reservas.",
      title: trial ? "Tu prueba gratis terminó" : inGrace ? "Tu plan venció" : "Tu página dejó de tomar reservas",
      paragraphs: [
        trial
          ? `La prueba gratis de <b>${name}</b> terminó y tu página dejó de tomar reservas online. No se te cobró nada.`
          : inGrace
            ? `El plan de <b>${name}</b> venció el ${fecha(until)}. Tu página sigue funcionando hasta el <b>${fecha(cut)}</b>; después deja de tomar reservas.`
            : `El plan de <b>${name}</b> venció y tu página dejó de tomar reservas online.`,
        `Tus canchas, turnos fijos y diseño siguen guardados. Apenas ${trial ? "elijas un plan" : "lo renueves"}, todo vuelve a funcionar como antes.`,
      ],
      button: { label: renewLabel, url: renewUrl },
    }),
    text: plain([
      trial ? "Tu prueba gratis de Córner terminó." : inGrace ? "Tu plan de Córner venció." : "Tu página de Córner dejó de tomar reservas.",
      inGrace ? `Tu página sigue funcionando hasta el ${fecha(cut)}.` : `Tu página no está tomando reservas online.`,
      `Tus datos siguen guardados. ${renewLabel}: ${renewUrl}`,
    ]),
  };
}

export function testMail(to: string): Mail {
  return {
    to,
    subject: "Córner · Mail de prueba",
    html: layout({ preheader: "Los mails de Córner funcionan.", title: "Los mails funcionan", paragraphs: ["Si estás leyendo esto, Resend quedó bien configurado y Córner ya puede mandar los mails de bienvenida y de vencimiento."] }),
    text: "Los mails de Córner funcionan: Resend quedó bien configurado.",
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
