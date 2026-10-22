import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getComplejo, sessionUser } from "@/lib/data";
import { planStatus, statusText } from "@/lib/plans";
import { CONTACT_WHATSAPP, waLink } from "@/lib/config";
import Sidebar from "./Sidebar";
import { RegisterSW } from "@/components/PushSetup";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role === "superadmin") redirect("/admin");
  const [u, c] = await Promise.all([sessionUser(s), s.cid ? getComplejo(s.cid) : null]);
  if (!u || !c) redirect("/login?vencida=1");
  const st = planStatus(c);
  const renew = CONTACT_WHATSAPP ? waLink(CONTACT_WHATSAPP, `Hola! Quiero ${st.plan === "prueba" ? "contratar un plan" : "renovar mi plan"} de Córner para ${c.name}.`) : null;
  let banner: { tone: "warn" | "bad"; text: string } | null = null;
  if (st.state === "vencido")
    banner = { tone: "bad", text: st.plan === "prueba" ? "Tu prueba gratis terminó. Tu página dejó de tomar reservas hasta que elijas un plan." : "Tu plan venció. Tu página dejó de tomar reservas hasta que lo renueves." };
  else if (st.state === "suspendido") banner = { tone: "bad", text: "Tu cuenta está suspendida. Escribinos para reactivarla." };
  else if (st.state === "prueba" && (st.daysLeft ?? 99) <= 5) banner = { tone: "warn", text: `Tu prueba gratis termina en ${st.daysLeft === 1 ? "1 día" : `${st.daysLeft} días`}. Elegí un plan para no cortar las reservas.` };
  else if (st.state === "activo" && st.until && st.until < Date.now()) banner = { tone: "warn", text: "Tu plan venció. Tenés unos días de gracia antes de que se corten las reservas." };

  return (
    <div className="panel-shell">
      <Sidebar name={c.name} email={s.email} slug={c.slug} planText={statusText(st)} state={st.state} />
      <RegisterSW />
      <main className="panel-main page-in">
        {banner && (
          <div className={`banner ${banner.tone}`} role="status">
            <span>{banner.text}</span>
            {renew && <a className="btn sm" href={renew} target="_blank" rel="noreferrer">{st.plan === "prueba" ? "Elegir plan" : "Renovar"}</a>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
