"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { money, toWa, waLink } from "@/lib/config";
import { ChatIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { cap, dayNum, fmtDow, fmtLong, hm, DOW_NAMES, dayOfWeek, nowMinutes, todayStr } from "@/lib/time";
import { SPORTS, type Booking, type Court } from "@/lib/types";

type Data = { date: string; today: string; now: number; courts: Court[]; hiddenCourts: number; bookings: Booking[]; nightFrom: number; whatsappName: string; status: { state: string; operating: boolean; features: string[]; label: string } };
const HPX = 60;
/** Cada cuánto se pregunta si hubo cambios (1 comando a Upstash por consulta) */
const POLL_MS = 15000;
const ORIGIN_LABEL = { web: "Web", manual: "Manual", fijo: "Fijo", bloqueo: "Bloqueo" } as const;
const color = (c?: Court) => (c ? `var(--${SPORTS[c.sport].group})` : "var(--muted)");

export default function AgendaClient({ days, initialDate, initialSel }: { days: string[]; initialDate?: string; initialSel?: string }) {
  const [date, setDate] = useState(initialDate ?? days[0]);
  const [raw, setData] = useState<Data | null>(null);
  // Reloj local: la hora actual y el día se calculan en el navegador, sin consultar la base
  const [clock, setClock] = useState(() => ({ today: todayStr(), now: nowMinutes() }));
  useEffect(() => {
    const tick = () => setClock((c) => {
      const n = { today: todayStr(), now: nowMinutes() };
      return n.today === c.today && n.now === c.now ? c : n;
    });
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);
  const data = useMemo(() => (raw ? { ...raw, today: clock.today, now: clock.now } : null), [raw, clock]);
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
    const t = setInterval(check, POLL_MS);
    const onVis = () => { if (!document.hidden) { setUnseen(0); check(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { stop = true; clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [load]);

  // Contador de reservas nuevas en el título de la pestaña
  useEffect(() => {
    const base = "Agenda · Córner";
    document.title = unseen ? `(${unseen}) Nueva reserva · Córner` : base;
  }, [unseen]);

  const pendingSel = useRef<string | null>(initialSel ?? null);
  const [detailNonce, setDetailNonce] = useState(0);
  const [notify, setNotify] = useState<{ name: string; phone: string; text: string } | null>(null);
  useEffect(() => {
    setSel(pendingSel.current);
    pendingSel.current = null;
    setPrefill(null);
  }, [date]);
  const goTo = (d: string, id: string | null) => {
    if (d === date) setSel(id);
    else {
      pendingSel.current = id;
      setDate(d);
    }
  };

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
              key={`${selected.id}-${detailNonce}`}
              b={selected}
              court={data.courts.find((c) => c.id === selected.courtId)}
              date={date}
              data={data}
              onClose={() => setSel(null)}
              onDone={(m) => { setSel(null); toast.show(m); load(); }}
              onMoved={(res, m, n) => { toast.show(m); setNotify(n); setDetailNonce((x) => x + 1); if (res.date === date) { load(); setSel(res.id); } else goTo(res.date, res.id); }}
            />
          )}
          {notify && (
            <div className="card notify" role="status">
              <div style={{ display: "grid", gap: 4 }}>
                <b>Avisale el cambio a {notify.name.split(" ")[0]}</b>
                <span className="muted small">El turno ya quedó movido. Mandale el aviso para que no se confunda.</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a className="btn wa sm" href={waLink(toWa(notify.phone), notify.text)} target="_blank" rel="noreferrer" onClick={() => setNotify(null)}><ChatIcon size={16} />Avisar por WhatsApp</a>
                <button className="btn ghost sm" onClick={() => setNotify(null)}>Listo</button>
              </div>
            </div>
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
            <button className="btn sm ghost" onClick={() => { goTo(notice.date, notice.id); setNotice(null); setUnseen(0); }}>Ver</button>
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

type MovedNotice = { name: string; phone: string; text: string } | null;

function freeSlotsFor(court: Court, day: Pick<Data, "date" | "today" | "now" | "bookings">, excludeId: string) {
  const out: number[] = [];
  const isToday = day.date === day.today;
  for (let t = court.open; t + court.dur <= court.close; t += court.dur) {
    if (isToday && t <= day.now) continue;
    if (day.bookings.some((b) => b.id !== excludeId && b.courtId === court.id && b.start < t + court.dur && t < b.start + b.dur)) continue;
    out.push(t);
  }
  return out;
}

function Detail({
  b, court, date, venue, data, onClose, onDone, onMoved,
}: {
  b: Booking; court?: Court; date: string; venue: string; data: Data;
  onClose: () => void; onDone: (m: string) => void;
  onMoved: (res: { id: string; date: string }, m: string, notify: MovedNotice) => void;
}) {
  const [arm, setArm] = useState<null | "dia" | "siempre">(null);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  async function remove(scope: "dia" | "siempre") {
    if (arm !== scope) return setArm(scope);
    const r = await fetch("/api/panel/turnos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, date, origin: b.origin, scope }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j.error || "No se pudo borrar.");
    onDone(b.origin === "fijo" ? (scope === "siempre" ? "Turno fijo eliminado" : "Turno liberado solo para este día") : b.origin === "bloqueo" ? "Bloqueo quitado" : "Turno cancelado");
  }
  if (editing) return <EditTurn b={b} date={date} data={data} venue={venue} onCancel={() => setEditing(false)} onMoved={onMoved} />;
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
      {data.status.operating && <button className="btn block" onClick={() => setEditing(true)}>Editar o mover</button>}
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

function EditTurn({
  b, date, data, venue, onCancel, onMoved,
}: {
  b: Booking; date: string; data: Data; venue: string; onCancel: () => void;
  onMoved: (res: { id: string; date: string }, m: string, notify: MovedNotice) => void;
}) {
  const [courtId, setCourtId] = useState(b.courtId);
  const [day, setDay] = useState(date);
  const [start, setStart] = useState<number>(b.start);
  const [name, setName] = useState(b.name);
  const [phone, setPhone] = useState(b.phone);
  const [scope, setScope] = useState<"dia" | "siempre">("dia");
  const [other, setOther] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Si elige otro día, trae la agenda de ese día para mostrar los horarios libres
  useEffect(() => {
    if (day === date) return setOther(null);
    let cancel = false;
    setOther(null);
    fetch(`/api/panel/agenda?date=${day}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (!cancel && j.courts) setOther(j); })
      .catch(() => {});
    return () => { cancel = true; };
  }, [day, date]);

  const dayData = day === date ? data : other;
  const court = data.courts.find((c) => c.id === courtId) ?? data.courts[0];
  const free = dayData ? freeSlotsFor(court, dayData, b.id) : [];
  const startVal = free.includes(start) ? start : free[0];
  const isBlock = b.origin === "bloqueo";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (startVal === undefined) return setErr("No hay horarios libres en esa cancha ese día.");
    setBusy(true);
    const r = await fetch("/api/panel/turnos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, date, origin: b.origin, scope, to: { courtId: court.id, date: day, start: startVal, name, phone } }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "No se pudo guardar.");
    const moved = court.id !== b.courtId || day !== date || startVal !== b.start;
    const msg = !moved ? "Cambios guardados" : b.origin === "fijo" && scope === "siempre" ? "Turno fijo movido para todas las semanas" : "Turno movido";
    const notify = moved && phone && !isBlock
      ? { name, phone, text: `¡Hola ${name.split(" ")[0]}! Te avisamos que tu turno en ${venue} cambió: ahora es en ${court.name}, ${fmtLong(day)} a las ${hm(startVal)}. ¡Te esperamos!` }
      : null;
    onMoved({ id: j.id, date: j.date }, msg, notify);
  }

  return (
    <form className="card form" onSubmit={save}>
      <div className="sheet-head">
        <h3>Editar turno</h3>
        <button type="button" className="x" onClick={onCancel} aria-label="Volver">×</button>
      </div>
      {b.origin === "fijo" && (
        <div className="seg-choice" role="radiogroup" aria-label="Qué cambiar">
          <button type="button" role="radio" aria-checked={scope === "dia"} onClick={() => setScope("dia")}>Solo este día</button>
          <button type="button" role="radio" aria-checked={scope === "siempre"} onClick={() => setScope("siempre")}>Todas las semanas</button>
        </div>
      )}
      <label className="field"><span>Cancha</span>
        <select id="ed-court" value={court.id} onChange={(e) => setCourtId(e.target.value)}>
          {data.courts.map((c) => <option key={c.id} value={c.id}>{c.name} · {SPORTS[c.sport].label}</option>)}
        </select>
      </label>
      <label className="field"><span>Día</span>
        <input id="ed-day" type="date" value={day} min={data.today} onChange={(e) => e.target.value && setDay(e.target.value)} />
        {b.origin === "fijo" && scope === "siempre" && day !== date && <small>Pasa a ser fijo de todos los {DOW_NAMES[dayOfWeek(day)]} desde esa fecha.</small>}
      </label>
      <label className="field"><span>Horario</span>
        <select id="ed-start" value={startVal ?? ""} onChange={(e) => setStart(Number(e.target.value))} disabled={!dayData || !free.length}>
          {!dayData ? <option>Cargando…</option> : free.length ? free.map((t) => <option key={t} value={t}>{hm(t)} a {hm(t + court.dur)}{t === b.start && court.id === b.courtId && day === date ? " (actual)" : ""}</option>) : <option value="">Sin horarios libres</option>}
        </select>
      </label>
      <label className="field"><span>{isBlock ? "Motivo" : "Nombre"}</span><input id="ed-name" value={name} onChange={(e) => setName(e.target.value)} required /></label>
      {!isBlock && <label className="field"><span>WhatsApp</span><input id="ed-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></label>}
      {err && <p className="err" role="alert">{err}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" disabled={busy || !dayData || startVal === undefined}>{busy ? "Guardando…" : "Guardar"}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
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
