"use client";
import { useState } from "react";

const STEPS = [
  ["Cargar un turno de mostrador", "Tocás un hueco libre en la grilla, ponés el nombre y listo. Queda marcado como turno de teléfono o mostrador."],
  ["Marcar un turno fijo", "El grupo de todos los martes se carga una vez y queda bloqueado todas las semanas."],
  ["Bloquear una cancha", "Por lluvia, mantenimiento o un torneo. Nadie puede reservar ese horario desde la web."],
  ["Ver una reserva nueva en vivo", "Cuando alguien reserva desde la web, el turno aparece en la grilla con aviso y sonido."],
  ["Ver cómo viene el día", "Turnos, ocupación y lo que falta llenar, arriba de todo."],
] as const;

type Cell = { n: string; s: string; k: "futbol" | "padel" | "tenis"; lite?: boolean; live?: boolean } | null;
const AGENDA: { t: string; c: Cell[] }[] = [
  { t: "18:00", c: [{ n: "Martín G.", s: "Web", k: "futbol" }, null, { n: "Clase · Prof. Lucía", s: "Fijo", k: "tenis" }] },
  { t: "19:00", c: [{ n: "Los del laburo", s: "Fijo", k: "futbol" }, { n: "Sofi y Caro", s: "Web", k: "padel" }, null] },
  { t: "20:00", c: [{ n: "Nacho P.", s: "Teléfono", k: "futbol", lite: true }, { n: "Fede M.", s: "Web", k: "padel" }, null] },
  { t: "21:00", c: [{ n: "Juli y amigos", s: "Web", k: "futbol" }, { n: "Agus T.", s: "Web", k: "padel" }, { n: "Caro D.", s: "Nueva · Web", k: "tenis", live: true }] },
  { t: "22:00", c: [null, null, null] },
];

export default function HowTo() {
  const [step, setStep] = useState(0);
  return (
    <div className="lp-howto">
      <div>
        <p className="eyebrow" style={{ marginBottom: 10 }}>Cómo se hace · {step + 1} de {STEPS.length}</p>
        <ol className="lp-steplist">
          {STEPS.map(([title, text], i) => (
            <li key={title}>
              <button type="button" aria-expanded={step === i} onClick={() => setStep(i)} className={step === i ? "on" : ""}>
                <span className="n">0{i + 1}</span>
                <span className="t">{title}</span>
              </button>
              {step === i && <p>{text}</p>}
            </li>
          ))}
        </ol>
      </div>

      <div className="mock lp-panel" aria-label="Ejemplo de la agenda del panel">
        <div className="lp-panel-head">
          <div>
            <b>Jueves 22</b>
            <span className="muted small">11 turnos · 78% ocupado</span>
          </div>
          <span className="btn sm" aria-hidden="true">+ Cargar turno</span>
        </div>
        <div className="mini-agenda">
          <div className="h" />
          <div className="h"><i className="dot" style={{ background: "var(--futbol)" }} />Cancha 1</div>
          <div className="h"><i className="dot" style={{ background: "var(--padel)" }} />Pádel 1</div>
          <div className="h"><i className="dot" style={{ background: "var(--tenis)" }} />Tenis</div>
          {AGENDA.map((row, r) => (
            <Row key={row.t} row={row} r={r} />
          ))}
        </div>
        <div className="lp-panel-notice">
          <i className="lp-live-dot" />
          <div>
            <b>Nueva reserva</b>
            <span>Caro D. · Tenis 21:00 · desde la web</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ row, r }: { row: { t: string; c: Cell[] }; r: number }) {
  return (
    <>
      <div className="t">{row.t}</div>
      {row.c.map((c, i) => (
        <div className="cell" key={i}>
          {c && (
            <div className={`ev ${c.lite ? "lite" : ""} ${c.live ? "lp-new" : ""}`} style={{ background: `var(--${c.k})`, ["--i" as string]: r * 3 + i }}>
              <b>{c.n}</b>
              <small>{c.s}</small>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
