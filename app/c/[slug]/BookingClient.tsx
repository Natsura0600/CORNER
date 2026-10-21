"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { money, waLink } from "@/lib/config";
import { cap, dayNum, fmtDow, fmtLong, hm } from "@/lib/time";
import { SPORTS, type Sport } from "@/lib/types";

type Slot = { start: number; price: number; night: boolean; state: "libre" | "ocupado" | "pasado" };
type CourtAv = { id: string; name: string; sport: Sport; detail: string; dur: number; slots: Slot[] };
type Venue = { slug: string; name: string; whatsapp: string; cancelHours: number };
const GROUP_LABEL = { futbol: "Fútbol", padel: "Pádel", tenis: "Tenis" } as const;
type Group = keyof typeof GROUP_LABEL;

export default function BookingClient({ venue, days, groups }: { venue: Venue; days: string[]; groups: Group[] }) {
  const [group, setGroup] = useState<Group>(groups[0]);
  const [date, setDate] = useState(days[0]);
  const [courts, setCourts] = useState<CourtAv[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [pick, setPick] = useState<{ court: CourtAv; slot: Slot } | null>(null);

  const load = useCallback(async () => {
    setLoadErr("");
    try {
      const r = await fetch(`/api/disponibilidad?slug=${encodeURIComponent(venue.slug)}&date=${date}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setCourts(j.courts);
    } catch (e) {
      setLoadErr(e instanceof Error && e.message ? e.message : "No pudimos cargar los horarios.");
    }
  }, [venue.slug, date]);

  useEffect(() => {
    setCourts(null);
    load();
  }, [load]);

  const visible = (courts ?? []).filter((c) => SPORTS[c.sport].group === group);

  return (
    <div style={{ display: "grid", gap: 22 }}>
      {groups.length > 1 && (
        <div className="tabs" role="group" aria-label="Deporte">
          {groups.map((g) => (
            <button key={g} className="tab" aria-pressed={g === group} onClick={() => setGroup(g)}>{GROUP_LABEL[g]}</button>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        <span className="eyebrow">Elegí el día</span>
        <div className="days">
          {days.map((d, i) => (
            <button key={d} className="daybtn" aria-pressed={d === date} onClick={() => setDate(d)}>
              <small>{i === 0 ? "Hoy" : i === 1 ? "Mañana" : fmtDow(d)}</small>
              <b>{dayNum(d)}</b>
            </button>
          ))}
        </div>
      </div>

      {loadErr && <p className="err">{loadErr} <button className="linkbtn" onClick={load}>Reintentar</button></p>}
      {!courts && !loadErr && <p className="muted">Cargando horarios…</p>}

      {courts && (
        <div className="courts">
          {visible.map((c) => {
            const free = c.slots.filter((s) => s.state === "libre").length;
            return (
              <article key={c.id} className="court">
                <div className="court-head">
                  <h3><i className="dot" style={{ background: `var(--${SPORTS[c.sport].group})` }} />{c.name}</h3>
                  <span className="muted small">
                    {[SPORTS[c.sport].label, c.detail, `${c.dur} min`].filter(Boolean).join(" · ")} · {free} libre{free === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="slots">
                  {c.slots.map((s) => (
                    <button
                      key={s.start}
                      className="slot"
                      disabled={s.state !== "libre"}
                      onClick={() => setPick({ court: c, slot: s })}
                      aria-label={`${c.name} ${hm(s.start)} ${s.state}`}
                    >
                      <b>{hm(s.start)}</b>
                      <span>{s.state === "pasado" ? "Pasó" : s.state === "ocupado" ? "Ocupado" : `${s.night ? "☾ " : ""}${money(s.price)}`}</span>
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
          <p className="muted small">Precio total de la cancha. ☾ Tarifa nocturna. Se paga en el complejo.</p>
        </div>
      )}

      {pick && <BookSheet venue={venue} date={date} pick={pick} onClose={(changed) => { setPick(null); if (changed) load(); }} />}
    </div>
  );
}

function BookSheet({ venue, date, pick, onClose }: { venue: Venue; date: string; pick: { court: CourtAv; slot: Slot }; onClose: (changed: boolean) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; token: string } | null>(null);
  const { court, slot } = pick;
  const range = `${hm(slot.start)} a ${hm(slot.start + court.dur)}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("corner_player") ?? "{}");
      if (saved.name) setName(saved.name);
      if (saved.phone) setPhone(saved.phone);
    } catch {}
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: venue.slug, courtId: court.id, date, start: slot.start, name, phone }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      try { localStorage.setItem("corner_player", JSON.stringify({ name, phone })); } catch {}
      setDone(j);
    } catch (e) {
      setErr(e instanceof Error && e.message ? e.message : "No se pudo reservar. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const msg = `Hola! Reservé ${court.name} (${SPORTS[court.sport].label}) el ${fmtLong(date)} de ${range} a nombre de ${name}.`;

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(!!done); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet-head">
          {done ? <div className="okcircle" aria-hidden="true">✓</div> : <h2 id="sheet-title">Reservá tu turno</h2>}
          <button className="x" onClick={() => onClose(!!done)} aria-label="Cerrar">×</button>
        </div>
        {done && <h2 id="sheet-title">¡Turno reservado!</h2>}
        <div className="ticket">
          <div><span>Cancha</span><b>{court.name}</b></div>
          <div><span>Día</span><b>{cap(fmtLong(date))}</b></div>
          <div><span>Horario</span><b>{range}</b></div>
          <div><span>Precio</span><b>{money(slot.price)}</b></div>
        </div>
        {!done ? (
          <form className="form" onSubmit={submit}>
            <label className="field"><span>Nombre y apellido</span><input id="b-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required minLength={3} /></label>
            <label className="field"><span>WhatsApp</span><input id="b-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="11 5555 0000" required /></label>
            {err && <p className="err" role="alert">{err}</p>}
            <button className="btn block" disabled={busy}>{busy ? "Reservando…" : "Confirmar reserva"}</button>
            <p className="muted small">Se paga en el complejo. Podés cancelar online hasta {venue.cancelHours} h antes.</p>
          </form>
        ) : (
          <div className="form">
            <p className="muted">Avisale al complejo por WhatsApp y guardá el link de tu reserva para verla o cancelarla.</p>
            <a className="btn block" href={waLink(venue.whatsapp, msg)} target="_blank" rel="noreferrer">Avisar por WhatsApp</a>
            <Link className="btn ghost block" href={`/c/${venue.slug}/reserva/${done.id}?t=${done.token}`}>Ver mi reserva</Link>
          </div>
        )}
      </div>
    </div>
  );
}
