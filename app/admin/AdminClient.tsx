"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PLAN_LABEL } from "@/lib/config";
import type { Complejo, Plan } from "@/lib/types";

type Row = Complejo & { courts: number };

export default function AdminClient() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/complejos", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j.error || "No se pudo cargar.");
    setRows(j.complejos);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function patch(id: string, body: Partial<Pick<Complejo, "active" | "plan">>) {
    setErr("");
    const r = await fetch("/api/admin/complejos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j.error || "No se pudo guardar.");
    setRows((rs) => rs!.map((x) => (x.id === id ? { ...x, ...j.complejo } : x)));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!rows) return err ? <p className="err">{err}</p> : <p className="muted">Cargando…</p>;
  const filtered = rows.filter((r) => `${r.name} ${r.city} ${r.ownerEmail}`.toLowerCase().includes(q.toLowerCase()));
  const activos = rows.filter((r) => r.active).length;
  const pagos = rows.filter((r) => r.active && r.plan !== "prueba").length;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="stats">
        <div className="stat"><span>Complejos</span><b>{rows.length}</b></div>
        <div className="stat"><span>Activos</span><b>{activos}</b></div>
        <div className="stat"><span>Con plan pago</span><b>{pagos}</b></div>
        <div className="stat"><span>En prueba</span><b>{rows.filter((r) => r.plan === "prueba").length}</b></div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", justifyContent: "space-between" }}>
        <label className="field" style={{ flex: "1 1 260px", maxWidth: 380 }}><span>Buscar</span><input id="adm-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, ciudad o email" /></label>
        <button className="linkbtn" onClick={logout}>Cerrar sesión</button>
      </div>
      {err && <p className="err">{err}</p>}
      {rows.length === 0 ? (
        <div className="empty"><h3>Todavía no hay complejos registrados.</h3><p className="muted">Cuando alguien se registre desde la landing va a aparecer acá.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Complejo</th><th>Dueño</th><th>Canchas</th><th>Alta</th><th>Plan</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.name}</b><div className="muted small">{r.city}</div></td>
                  <td><div>{r.ownerEmail}</div><a className="muted small" href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noreferrer">{r.whatsapp}</a></td>
                  <td>{r.courts}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString("es-AR")}</td>
                  <td>
                    <select className="input" style={{ width: 120, padding: "7px 10px" }} value={r.plan} onChange={(e) => patch(r.id, { plan: e.target.value as Plan })} aria-label={`Plan de ${r.name}`}>
                      {(Object.keys(PLAN_LABEL) as Plan[]).map((p) => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
                    </select>
                  </td>
                  <td><span className={`pill ${r.active ? "on" : "off"}`}>{r.active ? "Activo" : "Suspendido"}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <a className="btn sm ghost" href={`/c/${r.slug}`} target="_blank" rel="noreferrer">Ver página</a>{" "}
                    <button className="btn sm ghost" onClick={() => patch(r.id, { active: !r.active })}>{r.active ? "Suspender" : "Activar"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
