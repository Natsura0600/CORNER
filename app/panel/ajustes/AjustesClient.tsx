"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { CONTACT_WHATSAPP, PLANS, money, waLink } from "@/lib/config";
import { addDays, hm, todayStr } from "@/lib/time";
import type { Complejo } from "@/lib/types";
import type { Feature, PlanState } from "@/lib/plans";

type Status = { state: PlanState; plan: string; label: string; text: string; features: Feature[]; courts: number; until: number | null };

export default function AjustesClient() {
  const router = useRouter();
  const [c, setC] = useState<Complejo | null>(null);
  const [st, setSt] = useState<Status | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const [from, setFrom] = useState(() => addDays(todayStr(), -30));
  const [to, setTo] = useState(() => todayStr());

  useEffect(() => {
    fetch("/api/panel/complejo", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { setC(j.complejo); setSt(j.status); })
      .catch(() => setErr("No se pudieron cargar los datos."));
  }, []);

  if (!c || !st) return err ? <p className="err">{err}</p> : <p className="muted">Cargando…</p>;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch("/api/panel/complejo", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "No se pudo guardar.");
    setC(j.complejo);
    toast.show("Cambios guardados");
    router.refresh();
  }

  const canExport = st.features.includes("exportar");
  const ask = (plan: string) => (CONTACT_WHATSAPP ? waLink(CONTACT_WHATSAPP, `Hola! Quiero el plan ${plan} de Córner para ${c.name}.`) : null);

  return (
    <div style={{ display: "grid", gap: 22, maxWidth: 900 }}>
      <section className="card" style={{ display: "grid", gap: 16 }} aria-labelledby="plan-h">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <span className="eyebrow">Tu plan</span>
            <h2 id="plan-h" style={{ fontSize: 28 }}>{st.text}</h2>
          </div>
          <span className={`pill ${st.state === "activo" ? "on" : st.state === "prueba" ? "warn" : "off"}`}>
            {{ prueba: "En prueba", activo: "Activo", vencido: "Vencido", suspendido: "Suspendido" }[st.state]}
          </span>
        </div>
        {st.state === "prueba" && <p className="muted">Durante la prueba tenés todas las funciones. Cuando termina, tu página deja de tomar reservas hasta que elijas un plan. No se cobra nada automáticamente.</p>}
        <div className="mini-plans">
          {PLANS.map((p) => {
            const current = st.plan === p.id;
            const link = ask(p.name);
            return (
              <div key={p.id} className={`mini-plan ${current ? "current" : ""}`}>
                <b>{p.name}</b>
                <span className="muted small">{p.courts} · {money(p.monthly)}/mes</span>
                {current ? <span className="pill on">Tu plan</span> : link ? <a className="btn sm ghost" href={link} target="_blank" rel="noreferrer">Quiero este</a> : null}
              </div>
            );
          })}
        </div>
        <Link href="/#comparar" className="linkbtn" target="_blank">Ver la comparación completa de planes</Link>
      </section>

      <form className="card form" onSubmit={submit} aria-labelledby="datos-h">
        <h2 id="datos-h" style={{ fontSize: 24 }}>Datos del complejo</h2>
        <div className="grid2">
          <label className="field"><span>Nombre del complejo</span><input id="s-name" name="name" defaultValue={c.name} required /></label>
          <label className="field"><span>WhatsApp (con código de país)</span><input id="s-wa" name="whatsapp" defaultValue={c.whatsapp} inputMode="tel" required /><small>Ej: 5491155550000. Ahí te escriben los jugadores.</small></label>
          <label className="field"><span>Ciudad</span><input id="s-city" name="city" defaultValue={c.city} /></label>
          <label className="field"><span>Dirección</span><input id="s-address" name="address" defaultValue={c.address} placeholder="Ej: Av. San Martín 1234" /></label>
          <label className="field"><span>Dirección de tu página</span><input id="s-slug" name="slug" defaultValue={c.slug} /><small>Queda como /c/{c.slug}</small></label>
          <label className="field"><span>Tarifa nocturna desde</span><input id="s-night" name="nightFrom" type="time" step={1800} defaultValue={hm(c.nightFrom)} required disabled={!st.features.includes("nocturna")} />{!st.features.includes("nocturna") && <small>Incluido desde el plan Club.</small>}</label>
          <label className="field"><span>Días de anticipación para reservar</span><input id="s-days" name="daysAhead" type="number" min={1} max={60} defaultValue={c.daysAhead} required /></label>
          <label className="field"><span>Cancelación online hasta (horas antes)</span><input id="s-cancel" name="cancelHours" type="number" min={0} max={72} defaultValue={c.cancelHours} required /></label>
        </div>
        {!st.features.includes("nocturna") && <input type="hidden" name="nightFrom" value={hm(c.nightFrom)} />}
        {err && <p className="err" role="alert">{err}</p>}
        <div><button className="btn" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button></div>
      </form>

      <section className="card form" aria-labelledby="exp-h">
        <h2 id="exp-h" style={{ fontSize: 24 }}>Exportar reservas a Excel</h2>
        {canExport ? (
          <>
            <div className="grid2">
              <label className="field"><span>Desde</span><input id="x-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
              <label className="field"><span>Hasta</span><input id="x-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /><small>Hasta 3 meses por archivo.</small></label>
            </div>
            <div><a className="btn ghost" href={`/api/panel/exportar?desde=${from}&hasta=${to}`}>Descargar archivo</a></div>
          </>
        ) : (
          <p className="muted">Descargá todos tus turnos con nombre, WhatsApp y precio para llevar las cuentas. Incluido en el plan Pro.</p>
        )}
      </section>
      {toast.node}
    </div>
  );
}
