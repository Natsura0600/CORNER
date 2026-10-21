"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { money, waLink } from "@/lib/config";
import { cap, fmtLong, hm } from "@/lib/time";
import { SPORTS, type Sport } from "@/lib/types";

type Data = {
  reserva: { id: string; date: string; start: number; dur: number; name: string; price: number };
  court: { name: string; sport: Sport } | null;
  complejo: { name: string; slug: string; address: string; city: string; whatsapp: string; cancelHours: number };
  canCancel: boolean;
  past: boolean;
};

export default function ReservaClient({ id, token, slug }: { id: string; token: string; slug: string }) {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const url = `/api/reservas/${id}?t=${encodeURIComponent(token)}`;

  useEffect(() => {
    fetch(url, { cache: "no-store" })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setD(j); })
      .catch((e) => setErr(e.message || "No encontramos esa reserva."));
  }, [url]);

  async function cancel() {
    setBusy(true);
    setErr("");
    const r = await fetch(url, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "No se pudo cancelar.");
    setCancelled(true);
  }

  if (cancelled)
    return (
      <div className="card" style={{ display: "grid", gap: 16 }}>
        <h1 style={{ fontSize: 34 }}>Turno cancelado</h1>
        <p className="muted">Liberamos el horario para que lo pueda tomar otra persona.</p>
        <Link className="btn" href={`/c/${slug}`}>Reservar otro turno</Link>
      </div>
    );
  if (err && !d) return <div className="empty"><h3>{err}</h3><Link className="btn ghost sm" href={`/c/${slug}`}>Ir al complejo</Link></div>;
  if (!d) return <p className="muted">Cargando…</p>;

  const { reserva: r, court, complejo: c } = d;
  return (
    <div className="card" style={{ display: "grid", gap: 18 }}>
      <p className="eyebrow">{c.name}</p>
      <h1 style={{ fontSize: 36 }}>Tu reserva, {r.name.split(" ")[0]}</h1>
      <div className="ticket">
        <div><span>Cancha</span><b>{court ? `${court.name} · ${SPORTS[court.sport].label}` : "—"}</b></div>
        <div><span>Día</span><b>{cap(fmtLong(r.date))}</b></div>
        <div><span>Horario</span><b>{hm(r.start)} a {hm(r.start + r.dur)}</b></div>
        <div><span>Precio</span><b>{money(r.price)}</b></div>
      </div>
      {(c.address || c.city) && <p className="muted">{[c.address, c.city].filter(Boolean).join(", ")}</p>}
      <a className="btn ghost" href={waLink(c.whatsapp)} target="_blank" rel="noreferrer">Escribirle al complejo</a>
      {!d.past && (d.canCancel ? (
        !confirm ? (
          <button className="linkbtn" onClick={() => setConfirm(true)}>Cancelar mi turno</button>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <p>¿Seguro que querés cancelar? El horario queda libre para otros.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn danger" onClick={cancel} disabled={busy}>{busy ? "Cancelando…" : "Sí, cancelar"}</button>
              <button className="btn ghost" onClick={() => setConfirm(false)}>No, mantener</button>
            </div>
          </div>
        )
      ) : (
        <p className="muted small">Faltan menos de {c.cancelHours} h: para cancelar escribile al complejo por WhatsApp.</p>
      ))}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
