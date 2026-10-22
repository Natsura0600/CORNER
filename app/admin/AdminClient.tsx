"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS, PLAN_LABEL, money } from "@/lib/config";
import { useToast } from "@/components/Toast";
import type { Complejo, Plan } from "@/lib/types";

type Row = Complejo & { courts: number; status: { state: "prueba" | "activo" | "vencido" | "suspendido"; text: string; until: number | null; daysLeft: number | null; limit: number } };
const TZ = "America/Argentina/Buenos_Aires";
const ymd = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(t));
const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "prueba", label: "En prueba" },
  { id: "activo", label: "Activos" },
  { id: "vencido", label: "Vencidos" },
  { id: "suspendido", label: "Suspendidos" },
] as const;

export default function AdminClient() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("todos");
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/complejos", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j.error || "No se pudo cargar.");
    setRows(j.complejos);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function patch(id: string, body: Record<string, unknown>, msg: string) {
    setErr("");
    setBusyId(id);
    const r = await fetch("/api/admin/complejos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    const j = await r.json().catch(() => ({}));
    setBusyId(null);
    if (!r.ok) return setErr(j.error || "No se pudo guardar.");
    setRows((rs) => rs!.map((x) => (x.id === id ? j.complejo : x)));
    toast.show(msg);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!rows) return err ? <p className="err">{err}</p> : <p className="muted">Cargando…</p>;
  const filtered = rows.filter((r) => (filter === "todos" || r.status.state === filter) && `${r.name} ${r.city} ${r.ownerEmail}`.toLowerCase().includes(q.toLowerCase()));
  const count = (s: string) => rows.filter((r) => r.status.state === s).length;
  const mrr = rows.filter((r) => r.status.state === "activo").reduce((a, r) => a + (PLANS.find((p) => p.id === r.plan)?.monthly ?? 0), 0);
  const soon = rows.filter((r) => r.status.daysLeft !== null && r.status.daysLeft >= 0 && r.status.daysLeft <= 7 && (r.status.state === "activo" || r.status.state === "prueba")).length;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="stats">
        <div className="stat"><span>Activos con plan pago</span><b>{count("activo")}</b></div>
        <div className="stat"><span>En prueba</span><b>{count("prueba")}</b></div>
        <div className="stat"><span>Vencen en 7 días</span><b>{soon}</b></div>
        <div className="stat"><span>Ingreso mensual (lista)</span><b>{money(mrr)}</b></div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", flex: "1 1 auto" }}>
          <label className="field" style={{ flex: "1 1 240px", maxWidth: 340 }}><span>Buscar</span><input id="adm-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, ciudad o email" /></label>
          <div className="tabs" role="group" aria-label="Filtrar por estado">
            {FILTERS.map((f) => (
              <button key={f.id} className="tab sm" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>
            ))}
          </div>
        </div>
        <button className="linkbtn" onClick={logout}>Cerrar sesión</button>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      {rows.length === 0 ? (
        <div className="empty"><h3>Todavía no hay complejos registrados.</h3><p className="muted">Cuando alguien se registre desde la landing va a aparecer acá.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Complejo</th><th>Plan</th><th>Estado</th><th>Pagado hasta</th><th>Registrar pago</th><th /></tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const busy = busyId === r.id;
                return (
                  <tr key={r.id} aria-busy={busy}>
                    <td>
                      <b>{r.name}</b>
                      <div className="muted small">{r.city} · {r.courts} cancha{r.courts === 1 ? "" : "s"}{r.courts > r.status.limit ? ` (plan permite ${r.status.limit})` : ""}</div>
                      <div className="muted small" style={{ overflowWrap: "anywhere" }}>{r.ownerEmail} · <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noreferrer">{r.whatsapp}</a></div>
                    </td>
                    <td>
                      <select className="input" style={{ width: 120, padding: "7px 10px" }} value={r.plan} disabled={busy} onChange={(e) => patch(r.id, { plan: e.target.value as Plan }, `Plan cambiado a ${PLAN_LABEL[e.target.value as Plan]}`)} aria-label={`Plan de ${r.name}`}>
                        {(Object.keys(PLAN_LABEL) as Plan[]).map((p) => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`pill ${r.status.state === "activo" ? "on" : r.status.state === "prueba" ? "warn" : "off"}`}>{r.status.text}</span>
                    </td>
                    <td>
                      {r.plan === "prueba" ? (
                        <span className="muted small">Prueba hasta {r.status.until ? new Date(r.status.until).toLocaleDateString("es-AR", { timeZone: TZ }) : "—"}</span>
                      ) : (
                        <input
                          className="input"
                          type="date"
                          style={{ width: 160, padding: "7px 10px" }}
                          aria-label={`Pagado hasta, ${r.name}`}
                          value={r.paidUntil ? ymd(r.paidUntil) : ""}
                          disabled={busy}
                          onChange={(e) => e.target.value && patch(r.id, { paidUntil: e.target.value }, "Fecha actualizada")}
                        />
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.plan === "prueba" ? (
                        <button className="btn sm ghost" disabled={busy} onClick={() => patch(r.id, { addTrialDays: 7 }, "Prueba extendida 7 días")}>+7 días de prueba</button>
                      ) : (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn sm ghost" disabled={busy} onClick={() => patch(r.id, { addMonths: 1 }, "Pago de 1 mes registrado")}>+1 mes</button>
                          <button className="btn sm ghost" disabled={busy} onClick={() => patch(r.id, { addMonths: 12 }, "Pago de 1 año registrado")}>+1 año</button>
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <a className="btn sm ghost" href={`/c/${r.slug}`} target="_blank" rel="noreferrer">Ver página</a>{" "}
                      <button className={`btn sm ${r.active ? "ghost" : ""}`} disabled={busy} onClick={() => patch(r.id, { active: !r.active }, r.active ? "Complejo suspendido" : "Complejo activado")}>{r.active ? "Suspender" : "Activar"}</button>{" "}
                      <button className="btn sm ghost danger-ghost" disabled={busy} onClick={() => setToDelete(r)}>Borrar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small">La prueba gratis vence sola a los 14 días y la página del complejo deja de tomar reservas. Los planes pagos tienen 3 días de gracia después de la fecha de pago. Pasar un complejo de prueba a un plan pago le suma 1 mes desde hoy.</p>
      {toDelete && (
        <DeleteDialog
          row={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={(id, name) => {
            setRows((rs) => rs!.filter((x) => x.id !== id));
            setToDelete(null);
            toast.show(`${name} fue borrado`);
          }}
        />
      )}
      {toast.node}
    </div>
  );
}

function DeleteDialog({ row, onClose, onDeleted }: { row: Row; onClose: () => void; onDeleted: (id: string, name: string) => void }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const match = text.trim() === row.name.trim();

  async function del() {
    setErr("");
    setBusy(true);
    const r = await fetch("/api/admin/complejos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, confirm: text }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "No se pudo borrar.");
    onDeleted(row.id, row.name);
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="sheet" role="alertdialog" aria-modal="true" aria-labelledby="del-h" aria-describedby="del-d">
        <div className="sheet-head">
          <h2 id="del-h" style={{ fontSize: 26 }}>Borrar {row.name}</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar" disabled={busy}>×</button>
        </div>
        <div id="del-d" style={{ display: "grid", gap: 10 }}>
          <p>Se borran para siempre la cuenta del dueño ({row.ownerEmail}), sus {row.courts} cancha{row.courts === 1 ? "" : "s"}, todos los turnos y reservas, el diseño y su página <b>/c/{row.slug}</b>. No se puede deshacer.</p>
          <p className="muted small">Si solo querés que deje de funcionar por un tiempo, mejor usá Suspender.</p>
        </div>
        <label className="field">
          <span>Para confirmar, escribí el nombre del complejo: <b style={{ color: "var(--ink)" }}>{row.name}</b></span>
          <input id="del-name" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" autoFocus />
        </label>
        {err && <p className="err" role="alert">{err}</p>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn danger" disabled={!match || busy} onClick={del}>{busy ? "Borrando…" : "Borrar para siempre"}</button>
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
