"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { money, toWa, waLink } from "@/lib/config";
import { ChatIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { cap, dayNum, fmtDow, fmtLong, hm, DOW_NAMES, dayOfWeek } from "@/lib/time";
import { SPORTS, type Booking, type Court } from "@/lib/types";

type Data = { date: string; today: string; now: number; courts: Court[]; hiddenCourts: number; bookings: Booking[]; nightFrom: number; whatsappName: string; status: { state: string; operating: boolean; features: string[]; label: string } };
const HPX = 60;
const ORIGIN_LABEL = { web: "Web", manual: "Manual", fijo: "Fijo", bloqueo: "Bloqueo" } as const;
const color = (c?: Court) => (c ? `var(--${SPORTS[c.sport].group})` : "var(--muted)");

export default function AgendaClient({ days }: { days: string[] }) {
  const [date, setDate] = useState(days[0]);
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{ courtId: string; start: number } | null>(null);
  const toast = useToast();
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<Live["last"]>(null);
  const [unseen, setUnseen] = useState(0);
  const ver = useRef<string | null>(null);
  const seenAt = useRef<number>(Date.now());
  const courtsRef = useRef<Court[]>([]);

  const load = useCallback(async () => {
    setErr("");
    try {
      const r = await fetch(`/api/panel/agenda?date=${date}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      courtsRef.current = j.courts;
      setData(j);
    } catch (e) {
      setErr(e instanceof Error && e.message ? e.message : "No se pudo cargar la agenda.");
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  // En vivo: cada pocos segundos pregunta si cambió algo (1 comando liviano).
  // Si cambió, recarga la grilla y avisa de las reservas online nuevas.
  useEffect(() => {
    let stop = false;
    async function check() {
      if (document.hidden) return;
      try {
        const r = await fetch("/api/panel/cambios", { cache: "no-store" });
        if (!r.ok || stop) return;
        const live: Live = await r.json();
        if (ver.current === null) { ver.current = live.v; return; }
        if (live.v === ver.current) return;
        ver.current = live.v;
        await load();
        if (live.last && live.last.at > seenAt.current) {
          seenAt.current = live.last.at;
          const id = live.last.id;
          setNotice(live.last);
          setUnseen((n) => n + 1);
          setFresh((f) => new Set(f).add(id));
          setTimeout(() => setFresh((f) => { const n = new Set(f); n.delete(id); return n; }), 12000);
          beep();
        }
      } catch {}
    }
    check();
    const t = setInterval(check, 6000);
    const onVis = () => { if (!document.hidden) { setUnseen(0); check(); } };
    document.addEventListener("visibilitychange", onVis);
    const full = setInterval(() => { if (!document.hidden) load(); }, 120000); // refresco completo cada 2 min (hora actual, turnos que pasan)
    return () => { stop = true; clearInterval(t); clearInterval(full); document.removeEventListener("visibilitychange", onVis); };
  }, [load]);

  // Contador de reservas nuevas en el título de la pestaña
  useEffect(() => {
    const base = "Agenda · Córner";
    document.title = unseen ? `(${unseen}) Nueva reserva · Córner` : base;
  }, [unseen]);

  useEffect(() => { setSel(null); setPrefill(null); }, [date]);

  const stats = useMemo(() => {
    if (!data) return null;
    const real = data.bookings.filter((b) => b.origin !== "bloqueo");
    const capMin = data.courts.reduce((a, c) => a + (c.close - c.open), 0);
    const used = real.reduce((a, b) => a + b.dur, 0);
    return { count: real.length, occ: capMin ? Math.round((used / capMin) * 100) : 0, money: real.reduce((a, b) => a + b.price, 0), web: real.filter((b) => b.origin === "web").length };
  }, [data]);

  if (err && !data) return <p className="err">{err} <button className="linkbtn" onClick={load}>Reintentar</button></p>;
  if (!data) return <p className="muted">Cargando agenda…</p>;

  if (data.courts.length === 0)
    return (
      <div className="empty">
        <h3>Cargá tu primera cancha</h3>
        <p className="muted">Con el deporte, la duración del turno y los precios ya podés empezar a recibir reservas.</p>
        <Link href="/panel/canchas" className="btn">Agregar canchas</Link>
      </div>
    );

  const startH = Math.floor(Math.min(...data.courts.map((c) => c.open)) / 60);
  const endH = Math.ceil(Math.max(...data.courts.map((c) => c.close)) / 60);
  const H = (endH - startH) * HPX;
  const y = (min: number) => ((min - startH * 60) / 60) * HPX;
  const selected = data.bookings.find((b) => b.id === sel) ?? null;
  const isToday = data.date === data.today;

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end" }}>
        <div className="days" style={{ flex: "1 1 400px", minWidth: 0 }}>
          {days.map((d, i) => (
            <button key={d} className="daybtn" aria-pressed={d === date} onClick={() => setDate(d)}>
              <small>{i === 0 ? "Hoy" : fmtDow(d)}</small>
              <b>{dayNum(d)}</b>
            </button>
          ))}
        </div>
        <label className="field" style={{ width: 170 }}>
          <span>Otra fecha</span>
          <input id="ag-date" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>

      <h2 style={{ fontSize: 26 }}>{cap(fmtLong(date))}</h2>

      {data.hiddenCourts > 0 && (
        <div className="banner warn"><span>Tenés {data.hiddenCourts} cancha{data.hiddenCourts === 1 ? "" : "s"} más de las que permite tu plan {data.status.label}. No se muestran ni se pueden reservar hasta que cambies de plan o las quites.</span></div>
      )}
      {stats && !data.status.features.includes("estadisticas") && (
        <div className="upsell"><b>Estadísticas del día</b><span>Ocupación, facturación estimada y reservas online, incluidas desde el plan Club.</span><Link className="btn sm ghost" href="/panel/ajustes">Ver planes</Link></div>
      )}
      {stats && data.status.features.includes("estadisticas") && (
        <div className="stats">
          <div className="stat"><span>Turnos</span><b>{stats.count}</b></div>
          <div className="stat"><span>Ocupación</span><b>{stats.occ}%</b></div>
          <div className="stat"><span>Facturación estimada</span><b>{money(stats.money)}</b></div>
          <div className="stat"><span>Reservados online</span><b>{stats.web}</b></div>
        </div>
      )}

      <div className="legend">
        <span><i className="sw" style={{ background: "var(--futbol)" }} />Reserva web</span>
        <span><i className="sw" style={{ background: "color-mix(in srgb, var(--futbol) 20%, var(--card))", boxShadow: "inset 0 0 0 1.5px var(--futbol)" }} />Carga manual</span>
        <span><i className="sw" style={{ background: "repeating-linear-gradient(135deg, var(--futbol) 0 4px, color-mix(in srgb, var(--futbol) 80%, #000) 4px 8px)" }} />Turno fijo</span>
        <span><i className="sw" style={{ background: "repeating-linear-gradient(45deg, var(--line) 0 3px, var(--soft) 3px 6px)" }} />Bloqueo</span>
        <span className="live-badge"><i />En vivo: las reservas nuevas aparecen solas</span>
      </div>

      <div className="agenda-wrap">
        <div className="gridbox">
          <div className="agenda" style={{ gridTemplateColumns: `56px repeat(${data.courts.length}, minmax(150px, 1fr))`, minWidth: 56 + data.courts.length * 150 }}>
            <div className="colhead corner" />
            {data.courts.map((c) => (
              <div key={c.id} className="colhead">
                <i className="dot" style={{ background: color(c) }} />
                <div style={{ minWidth: 0 }}>{c.name}<small>{SPORTS[c.sport].label} · {c.dur}′</small></div>
              </div>
            ))}
            <div className="times" style={{ height: H, position: "sticky" }}>
              {Array.from({ length: endH - startH }, (_, i) =>
                i ? <span key={i} style={{ top: i * HPX }}>{hm((startH + i) * 60)}</span> : null,
              )}
            </div>
            {data.courts.map((c) => {
              const mine = data.bookings.filter((b) => b.courtId === c.id);
              const slots = (() => { const o: number[] = []; for (let t = c.open; t + c.dur <= c.close; t += c.dur) o.push(t); return o; })();
              return (
                <div key={c.id} className="col" style={{ height: H }}>
                  {Array.from({ length: endH - startH }, (_, i) => (i ? <div key={i} className="hr" style={{ top: i * HPX }} /> : null))}
                  {c.open > startH * 60 && <div className="closed" style={{ top: 0, height: y(c.open) }} />}
                  {c.close < endH * 60 && <div className="closed" style={{ top: y(c.close), bottom: 0 }} />}
                  {slots
                    .filter((t) => !mine.some((b) => b.start < t + c.dur && t < b.start + b.dur) && !(isToday && t <= data.now))
                    .map((t) => (
                      <button key={t} className="slotbtn" style={{ top: y(t) + 2, height: (c.dur / 60) * HPX - 4 }} onClick={() => { setSel(null); setPrefill({ courtId: c.id, start: t }); }} aria-label={`Cargar turno ${c.name} ${hm(t)}`}>
                        + {hm(t)}
                      </button>
                    ))}
                  {mine.map((b) => (
                    <button
                      key={b.id}
                      className={`blk ${b.origin === "web" ? "" : b.origin} ${b.id === sel ? "sel" : ""} ${fresh.has(b.id) ? "nuevo" : ""}`}
                      style={{ top: y(b.start) + 1, height: (b.dur / 60) * HPX - 3, ["--c" as string]: color(c) }}
                      onClick={() => { setPrefill(null); setSel(b.id); }}
                    >
                      <b>{b.name}</b>
                      <span>{hm(b.start)}–{hm(b.start + b.dur)} · {ORIGIN_LABEL[b.origin]}</span>
                    </button>
                  ))}
                  {isToday && data.now > startH * 60 && data.now < endH * 60 && <div className="nowline" style={{ top: y(data.now) }} />}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="side">
          {selected && (
            <Detail
              venue={data.whatsappName}
              key={selected.id}
              b={selected}
              court={data.courts.find((c) => c.id === selected.courtId)}
              date={date}
              onClose={() => setSel(null)}
              onDone={(m) => { setSel(null); toast.show(m); load(); }}
            />
          )}
          {!data.status.operating ? (
            <div className="card"><b>Carga de turnos pausada</b><p className="muted small" style={{ marginTop: 6 }}>Con el plan vencido no se pueden cargar turnos nuevos. Los que ya tenés siguen en la agenda.</p></div>
          ) : <NewTurn
            key={prefill ? `${prefill.courtId}-${prefill.start}` : "blank"}
            data={data}
            prefill={prefill}
            onDone={(m) => { setPrefill(null); toast.show(m); load(); }}
          />}
        </aside>
      </div>
      {notice && (
        <div className="live-notice" role="status">
          <span className="live-dot" aria-hidden="true" />
          <div style={{ minWidth: 0 }}>
            <b>Nueva reserva · {notice.name}</b>
            <span>
              {courtsRef.current.find((c) => c.id === notice.courtId)?.name ?? "Cancha"} · {notice.date === data.date ? "este día" : cap(fmtDow(notice.date)) + " " + dayNum(notice.date)} · {hm(notice.start)}
            </span>
          </div>
          {notice.phone && (
            <a className="btn sm wa" href={waLink(toWa(notice.phone), confirmMsg(notice.name, data.whatsappName, courtsRef.current.find((c) => c.id === notice.courtId)?.name ?? "la cancha", notice.date, notice.start))} target="_blank" rel="noreferrer"><ChatIcon size={16} />Confirmar</a>
          )}
          {notice.date !== date && (
            <button className="btn sm ghost" onClick={() => { setDate(notice.date); setSel(notice.id); setNotice(null); setUnseen(0); }}>Ver</button>
          )}
          <button className="x" onClick={() => { setNotice(null); setUnseen(0); }} aria-label="Cerrar aviso">×</button>
        </div>
      )}
      {toast.node}
    </>
  );
}

type Live = { v: string; last: { id: string; date: string; start: number; courtId: string; name: string; phone: string; at: number } | null };

/** Mensaje para confirmarle el turno al cliente por WhatsApp */
function confirmMsg(name: string, venue: string, court: string, date: string, start: number) {
  return `¡Hola ${name.split(" ")[0]}! Te confirmamos tu turno en ${venue}: ${court}, ${fmtLong(date)} a las ${hm(start)}. ¡Te esperamos!`;
}

/** Sonido corto de aviso. El navegador solo lo permite después de que tocaste algo en la página. */
function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 600);
  } catch {}
}

function Detail({ b, court, date, venue, onClose, onDone }: { b: Booking; court?: Court; date: string; venue: string; onClose: () => void; onDone: (m: string) => void }) {
  const [arm, setArm] = useState<null | "dia" | "siempre">(null);
  const [err, setErr] = useState("");
  async function remove(scope: "dia" | "siempre") {
    if (arm !== scope) return setArm(scope);
    const r = await fetch("/api/panel/turnos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, date, origin: b.origin, scope }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j.error || "No se pudo borrar.");
    onDone(b.origin === "fijo" ? (scope === "siempre" ? "Turno fijo eliminado" : "Turno liberado solo para este día") : b.origin === "bloqueo" ? "Bloqueo quitado" : "Turno cancelado");
  }
  return (
    <div className="card detail" style={{ display: "grid", gap: 14 }}>
      <div className="sheet-head">
        <h3>{b.name}</h3>
        <button className="x" onClick={onClose} aria-label="Cerrar detalle">×</button>
      </div>
      <dl>
        <dt>Cancha</dt><dd>{court ? `${court.name} · ${SPORTS[court.sport].label}` : "—"}</dd>
        <dt>Horario</dt><dd>{hm(b.start)} a {hm(b.start + b.dur)}</dd>
        <dt>Tipo</dt><dd>{b.origin === "fijo" ? `Fijo de todos los ${DOW_NAMES[dayOfWeek(date)]}` : ORIGIN_LABEL[b.origin]}</dd>
        {b.origin !== "bloqueo" && <><dt>Precio</dt><dd>{money(b.price)}</dd></>}
        {b.phone && <><dt>WhatsApp</dt><dd>{b.phone}</dd></>}
      </dl>
      {b.phone && b.origin !== "bloqueo" && (
        <a className="btn wa block" href={waLink(toWa(b.phone), confirmMsg(b.name, venue, court?.name ?? "la cancha", date, b.start))} target="_blank" rel="noreferrer">
          <ChatIcon />Confirmar por WhatsApp
        </a>
      )}
      {b.origin === "fijo" ? (
        <div style={{ display: "grid", gap: 8 }}>
          <button className={`btn ghost block ${arm === "dia" ? "danger" : ""}`} onClick={() => remove("dia")}>{arm === "dia" ? "Confirmar: liberar este día" : "Liberar solo este día"}</button>
          <button className={`btn ghost block ${arm === "siempre" ? "danger" : ""}`} onClick={() => remove("siempre")}>{arm === "siempre" ? "Confirmar: quitar el fijo" : "Quitar turno fijo"}</button>
        </div>
      ) : (
        <button className={`btn ghost block ${arm ? "danger" : ""}`} onClick={() => remove("dia")}>
          {arm ? "Confirmar: liberar el horario" : b.origin === "bloqueo" ? "Quitar bloqueo" : "Cancelar turno"}
        </button>
      )}
      {err && <p className="err">{err}</p>}
    </div>
  );
}

function NewTurn({ data, prefill, onDone }: { data: Data; prefill: { courtId: string; start: number } | null; onDone: (m: string) => void }) {
  const [courtId, setCourtId] = useState(prefill?.courtId ?? data.courts[0].id);
  const court = data.courts.find((c) => c.id === courtId) ?? data.courts[0];
  const isToday = data.date === data.today;
  const free = useMemo(() => {
    const o: number[] = [];
    for (let t = court.open; t + court.dur <= court.close; t += court.dur) {
      if (isToday && t <= data.now) continue;
      if (data.bookings.some((b) => b.courtId === court.id && b.start < t + court.dur && t < b.start + b.dur)) continue;
      o.push(t);
    }
    return o;
  }, [court, data, isToday]);
  const [start, setStart] = useState<number | "">(prefill?.start ?? "");
  const [type, setType] = useState("manual");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const startVal: number | "" = start !== "" && free.includes(start) ? start : free.length ? free[0] : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (startVal === "") return setErr("Esa cancha no tiene horarios libres este día.");
    setBusy(true);
    const r = await fetch("/api/panel/turnos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, courtId: court.id, date: data.date, start: startVal, name, phone }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "No se pudo guardar.");
    onDone(type === "fijo" ? `Turno fijo creado para todos los ${DOW_NAMES[dayOfWeek(data.date)]}` : type === "bloqueo" ? "Horario bloqueado" : "Turno cargado");
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h3>Cargar turno</h3>
      <label className="field"><span>Tipo</span>
        <select id="nt-type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="manual">Reserva por teléfono o mostrador</option>
          <option value="fijo">Turno fijo (todas las semanas)</option>
          <option value="bloqueo">Bloqueo (lluvia, mantenimiento, torneo)</option>
        </select>
      </label>
      <label className="field"><span>Cancha</span>
        <select id="nt-court" value={court.id} onChange={(e) => setCourtId(e.target.value)}>
          {data.courts.map((c) => <option key={c.id} value={c.id}>{c.name} · {SPORTS[c.sport].label}</option>)}
        </select>
      </label>
      <label className="field"><span>Horario</span>
        <select id="nt-start" value={startVal} onChange={(e) => setStart(Number(e.target.value))} disabled={!free.length}>
          {free.length ? free.map((t) => <option key={t} value={t}>{hm(t)} a {hm(t + court.dur)}{type !== "bloqueo" ? ` · ${money(t >= data.nightFrom ? court.priceNight : court.priceDay)}` : ""}</option>) : <option value="">Sin horarios libres</option>}
        </select>
      </label>
      <label className="field"><span>{type === "bloqueo" ? "Motivo" : "Nombre"}</span>
        <input id="nt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={type === "bloqueo" ? "Ej: Lluvia" : "Ej: Gonza y los pibes"} required />
      </label>
      {type !== "bloqueo" && (
        <label className="field"><span>WhatsApp (opcional)</span>
          <input id="nt-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="11 5555 0000" />
        </label>
      )}
      {type === "fijo" && <p className="muted small">Se repite todos los {DOW_NAMES[dayOfWeek(data.date)]} desde esta fecha.</p>}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn block" disabled={busy || !free.length}>{busy ? "Guardando…" : "Agregar a la agenda"}</button>
    </form>
  );
}
