"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { hm } from "@/lib/time";
import { SPORTS, type Court, type Sport } from "@/lib/types";

type Draft = Omit<Court, "id"> & { id?: string; key: string };
const TIMES = Array.from({ length: 49 }, (_, i) => i * 30); // 00:00 a 24:00
const DURS = [30, 45, 60, 75, 90, 120];
let k = 0;
const blank = (n: number): Draft => ({ key: `n${k++}`, name: `Cancha ${n}`, sport: "futbol5", detail: "", dur: 60, open: 9 * 60, close: 24 * 60, priceDay: 0, priceNight: 0 });

export default function CanchasClient() {
  const router = useRouter();
  const [list, setList] = useState<Draft[] | null>(null);
  const [limit, setLimit] = useState(99);
  const [nocturna, setNocturna] = useState(true);
  const [planName, setPlanName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [arm, setArm] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/panel/canchas", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        setLimit(j.limit);
        setNocturna(j.nocturna);
        setPlanName(j.plan);
        setList(j.courts.length ? j.courts.map((c: Court) => ({ ...c, key: c.id })) : [blank(1)]);
        if (!j.courts.length) setDirty(true);
      })
      .catch(() => setErr("No se pudieron cargar las canchas."));
  }, []);

  if (!list) return err ? <p className="err">{err}</p> : <p className="muted">Cargando…</p>;

  const update = (key: string, patch: Partial<Draft>) => {
    setDirty(true);
    setList((l) => l!.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  async function save() {
    setErr("");
    setBusy(true);
    const r = await fetch("/api/panel/canchas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courts: list!.map(({ key, ...c }) => c) }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "No se pudo guardar.");
    setList(j.courts.map((c: Court) => ({ ...c, key: c.id })));
    setDirty(false);
    toast.show(j.removedFijos ? `Canchas guardadas. Se quitaron ${j.removedFijos} turnos fijos que ya no encajaban.` : "Canchas guardadas");
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {list.map((c, i) => (
        <section key={c.key} className="court-edit" aria-label={c.name || `Cancha ${i + 1}`}>
          <div className="top">
            <h3 style={{ fontSize: 22, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="dot" style={{ background: `var(--${SPORTS[c.sport].group})` }} />
              {c.name || `Cancha ${i + 1}`}
            </h3>
            <button
              className={`btn sm ghost ${arm === c.key ? "danger" : ""}`}
              onClick={() => {
                if (arm !== c.key) return setArm(c.key);
                setArm(null);
                setDirty(true);
                setList((l) => l!.filter((x) => x.key !== c.key));
              }}
            >
              {arm === c.key ? "Confirmar: quitar" : "Quitar"}
            </button>
          </div>
          <div className="grid4">
            <label className="field"><span>Nombre</span><input id={`c-name-${c.key}`} value={c.name} onChange={(e) => update(c.key, { name: e.target.value })} /></label>
            <label className="field"><span>Deporte</span>
              <select id={`c-sport-${c.key}`} value={c.sport} onChange={(e) => { const s = e.target.value as Sport; update(c.key, { sport: s, dur: SPORTS[s].dur }); }}>
                {(Object.keys(SPORTS) as Sport[]).map((s) => <option key={s} value={s}>{SPORTS[s].label}</option>)}
              </select>
            </label>
            <label className="field" style={{ gridColumn: "span 2" }}><span>Detalle (opcional)</span><input id={`c-detail-${c.key}`} value={c.detail} placeholder="Ej: Sintético · techada" onChange={(e) => update(c.key, { detail: e.target.value })} /></label>
            <label className="field"><span>Duración del turno</span>
              <select id={`c-dur-${c.key}`} value={c.dur} onChange={(e) => update(c.key, { dur: Number(e.target.value) })}>
                {DURS.map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </label>
            <label className="field"><span>Primer turno</span>
              <select id={`c-open-${c.key}`} value={c.open} onChange={(e) => update(c.key, { open: Number(e.target.value) })}>
                {TIMES.slice(0, -1).map((t) => <option key={t} value={t}>{hm(t)}</option>)}
              </select>
            </label>
            <label className="field"><span>Cierra</span>
              <select id={`c-close-${c.key}`} value={c.close} onChange={(e) => update(c.key, { close: Number(e.target.value) })}>
                {TIMES.slice(1).map((t) => <option key={t} value={t}>{t === 1440 ? "24:00" : hm(t)}</option>)}
              </select>
            </label>
            <div className="field"><span>Turnos por día</span><b style={{ paddingTop: 10 }}>{Math.max(0, Math.floor((c.close - c.open) / c.dur))}</b></div>
            <label className="field"><span>Precio de día ($)</span><input id={`c-pd-${c.key}`} type="number" min={0} step={500} value={c.priceDay || ""} onChange={(e) => update(c.key, { priceDay: Number(e.target.value) })} /></label>
            <label className="field"><span>Precio de noche ($)</span><input id={`c-pn-${c.key}`} type="number" min={0} step={500} value={c.priceNight || ""} disabled={!nocturna} onChange={(e) => update(c.key, { priceNight: Number(e.target.value) })} />{!nocturna && <small>Incluido desde el plan Club. Hoy se cobra el precio de día todo el día.</small>}</label>
          </div>
        </section>
      ))}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <button className="btn ghost" disabled={list.length >= limit} onClick={() => { setDirty(true); setList((l) => [...l!, blank(l!.length + 1)]); }}>+ Agregar cancha</button>
        <button className="btn" onClick={save} disabled={busy || !dirty || list.length > limit}>{busy ? "Guardando…" : dirty ? "Guardar cambios" : "Guardado"}</button>
        {list.length >= limit && <span className="muted small">Tu plan {planName} permite hasta {limit} canchas.</span>}
        {list.length > limit && <span className="err">Tenés {list.length - limit} de más: quitá alguna para poder guardar.</span>}
      </div>
      <p className="muted small">La tarifa nocturna arranca a la hora que configures en Ajustes.</p>
      {err && <p className="err" role="alert">{err}</p>}
      {toast.node}
    </div>
  );
}
