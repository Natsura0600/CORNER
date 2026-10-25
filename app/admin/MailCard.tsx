"use client";
import { useEffect, useState } from "react";

type Cfg = { configured: boolean; from: string; admin: string; cron: boolean };
type Run = { revisados: number; enviados: { complejo: string; tipo: string; ok: boolean; error?: string }[] };

export default function MailCard() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [busy, setBusy] = useState<"test" | "run" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [run, setRun] = useState<Run | null>(null);

  useEffect(() => {
    fetch("/api/admin/mails", { cache: "no-store" }).then((r) => r.json()).then(setCfg).catch(() => {});
  }, []);

  async function act(action: "test" | "run") {
    setBusy(action);
    setMsg(null);
    setRun(null);
    const r = await fetch("/api/admin/mails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const j = await r.json().catch(() => ({}));
    setBusy(null);
    if (!r.ok) return setMsg({ ok: false, text: j.error || "No se pudo." });
    if (action === "test") setMsg({ ok: true, text: `Mail de prueba enviado a ${j.sent}. Fijate también en spam.` });
    else setRun(j);
  }

  if (!cfg) return null;
  const sent = run?.enviados.filter((e) => e.ok).length ?? 0;
  return (
    <section className="card" style={{ display: "grid", gap: 12 }} aria-labelledby="mail-h">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <h2 id="mail-h" style={{ fontSize: 22 }}>Mails automáticos</h2>
        <span className={`pill ${cfg.configured && cfg.cron ? "on" : "off"}`}>{cfg.configured ? (cfg.cron ? "Activos" : "Falta CRON_SECRET") : "Sin configurar"}</span>
      </div>
      <p className="muted small">
        Bienvenida al registrarse, aviso a vos de cada complejo nuevo{cfg.admin ? ` (${cfg.admin})` : ""}, y avisos de vencimiento 3 días antes y cuando vence. Los vencimientos se revisan una vez por día, a las 9 de la mañana.
        {cfg.configured ? ` Salen desde ${cfg.from}.` : " Cargá RESEND_API_KEY y MAIL_FROM en Vercel para activarlos."}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn sm ghost" disabled={!cfg.configured || !!busy} onClick={() => act("test")}>{busy === "test" ? "Enviando…" : "Mandarme un mail de prueba"}</button>
        <button className="btn sm ghost" disabled={!!busy} onClick={() => act("run")}>{busy === "run" ? "Revisando…" : "Revisar vencimientos ahora"}</button>
      </div>
      {msg && <p className={msg.ok ? "okmsg small" : "err"} role="status">{msg.text}</p>}
      {run && (
        <p className="small" role="status">
          Revisé {run.revisados} complejo{run.revisados === 1 ? "" : "s"}. {run.enviados.length === 0 ? "No había avisos pendientes." : `Avisos enviados: ${sent} de ${run.enviados.length}.`}
          {run.enviados.filter((e) => !e.ok).map((e) => <span key={e.complejo} className="err" style={{ display: "block" }}>{e.complejo}: {e.error}</span>)}
        </p>
      )}
    </section>
  );
}
