/** Plano del complejo de ejemplo para el hero: canchas en juego encendidas, libres apagadas. */

type Court = { name: string; kind: "futbol" | "padel" | "tenis"; live: boolean; info: string; cta?: string };

const COURTS: Court[] = [
  { name: "Cancha 1 · Fútbol 5", kind: "futbol", live: true, info: "hasta 20:00" },
  { name: "Cancha 2 · Fútbol 5", kind: "futbol", live: false, info: "Libre", cta: "Reservar 20:00" },
  { name: "Pádel 1 · techada", kind: "padel", live: true, info: "hasta 20:30" },
  { name: "Tenis · polvo", kind: "tenis", live: false, info: "Libre", cta: "Libre 21:00" },
];

export default function CourtMap() {
  return (
    <div className="lp-map-wrap">
      <div className="mock lp-map" aria-label="Ejemplo: el plano de un complejo en Córner">
        <div className="lp-map-head">
          <div>
            <b>El Potrero</b>
            <span>cornerapp.com.ar/c/elpotrero</span>
          </div>
          <span className="lp-pill"><i className="lp-live-dot" />2 en juego · 19:40</span>
        </div>
        <div className="lp-courts">
          {COURTS.map((c, i) => (
            <div key={c.name} className="lp-court" style={{ ["--i" as string]: i }}>
              <div className={`lp-field ${c.kind === "futbol" ? "f5" : "net"} ${c.live ? "on" : "off"}`} style={{ ["--c" as string]: `var(--${c.kind})` }}>
                <i className="l1" />
                <i className="l2" />
                <i className="l3" />
                {c.live && <span className="lp-field-tag">En juego</span>}
                {!c.live && c.cta && <span className={`lp-field-cta ${c.kind === "futbol" ? "hot" : ""}`}>{c.cta}</span>}
              </div>
              <div className="lp-court-foot">
                <b>{c.name}</b>
                <span className={c.live ? "" : "free"}>{c.info}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="lp-next">
          <b>Quedan 9 turnos hoy</b>
          <span className="chip">20:00 · C2</span>
          <span className="chip">20:30 · Pádel 2</span>
          <span className="chip">21:00 · Tenis</span>
        </div>
      </div>
      <div className="lp-night" aria-hidden="true">
        <i className="lp-live-dot" />
        <div>
          <b>Martes 23:47</b>
          <span>Juan F. reservó la Cancha 2 para las 20:00. Vos dormías.</span>
        </div>
      </div>
    </div>
  );
}
