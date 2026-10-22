import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Plans from "@/components/Plans";
import { CONTACT_WHATSAPP, TRIAL_DAYS, waLink } from "@/lib/config";

const AGENDA = [
  { t: "18:00", c: [{ n: "Martín G.", s: "Web", k: "futbol" }, null, { n: "Clase · Prof. Lucía", s: "Fijo", k: "tenis" }] },
  { t: "19:00", c: [{ n: "Los del laburo", s: "Fijo", k: "futbol" }, { n: "Sofi y Caro", s: "Web", k: "padel" }, null] },
  { t: "20:00", c: [{ n: "Nacho P.", s: "Teléfono", k: "futbol", lite: true }, { n: "Sofi y Caro", s: "", k: "padel", cont: true }, { n: "Fede M.", s: "Web", k: "tenis" }] },
  { t: "21:00", c: [{ n: "Juli y amigos", s: "Web", k: "futbol" }, { n: "Agus T.", s: "Web", k: "padel" }, { n: "Caro D.", s: "Nueva · Web", k: "tenis", live: true }] },
  { t: "22:00", c: [null, { n: "Agus T.", s: "", k: "padel", cont: true }, null] },
] as const;

export default function Home() {
  const contact = CONTACT_WHATSAPP ? waLink(CONTACT_WHATSAPP, "Hola! Tengo un complejo y quiero saber más de Córner") : null;
  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="hero">
          <div className="container">
            <div className="hero-copy">
              <p className="eyebrow">Turnos online para fútbol, pádel y tenis</p>
              <h1 style={{ marginTop: 16 }}>
                Organizá tus canchas.<br />
                Llená tus <span className="flag">turnos.</span>
              </h1>
              <p className="lead">
                Córner es la agenda online de tu complejo. Tus jugadores reservan solos desde el celular, a cualquier hora, y vos ves todo en una sola grilla. Sin planillas ni audios a las dos de la mañana.
              </p>
              <div className="ctas">
                <Link href="/registro" className="btn">Quiero mi agenda</Link>
                <Link href="#planes" className="btn ghost">Ver planes</Link>
              </div>
              <p className="note">{TRIAL_DAYS} días gratis. Sin tarjeta. Lo configurás en 10 minutos.</p>
            </div>

            <div className="mock" aria-label="Ejemplo de agenda del complejo">
              <div className="mock-head">
                <b>Jueves 22</b>
                <span className="muted">11 turnos · 78% ocupado</span>
              </div>
              <div className="mini-agenda">
                <div className="h" />
                <div className="h"><i className="dot" style={{ background: "var(--futbol)" }} />Cancha 1</div>
                <div className="h"><i className="dot" style={{ background: "var(--padel)" }} />Pádel 1</div>
                <div className="h"><i className="dot" style={{ background: "var(--tenis)" }} />Tenis</div>
                {AGENDA.map((row, i) => (
                  <Row key={row.t} row={row} rowIndex={i} />
                ))}
              </div>
              <div className="mock-toast" aria-hidden="true"><i />Nueva reserva · Caro D. · Tenis 21:00</div>
            </div>
          </div>
        </section>

        {/* FUNCIONES */}
        <section className="section">
          <div className="container">
            <div className="section-head" data-reveal>
              <p className="eyebrow">Todo en un lugar</p>
              <h2>Menos teléfono, más canchas ocupadas.</h2>
              <p>Pensado para cómo funciona un complejo en serio: turnos de distinta duración, fijos de todas las semanas y la luz que se cobra aparte.</p>
            </div>

            <div className="feature" data-reveal>
              <div className="copy">
                <p className="eyebrow">Sin idas y vueltas</p>
                <h3>Reservan solos, a la hora que sea.</h3>
                <p>Tu complejo tiene su propia página. El jugador elige deporte, día y horario, deja su nombre y WhatsApp, y listo. Nunca se reserva dos veces el mismo turno.</p>
                <ul className="checks">
                  <li>Turnos de 60 o 90 minutos según la cancha</li>
                  <li>Precio diurno y nocturno automático</li>
                  <li>Cancelación online con el plazo que vos definas</li>
                </ul>
              </div>
              <div className="phone" aria-label="Ejemplo de reserva desde el celular">
                <div className="row">
                  <span className="chip">Fútbol 5</span>
                  <span className="chip on">Pádel</span>
                  <span className="chip">Tenis</span>
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <b style={{ fontFamily: "var(--display)", fontStretch: "110%", fontSize: 20 }}>Pádel 1 · techada</b>
                  <span className="muted small">Viernes 23 · turnos de 90 min</span>
                </div>
                <div className="slotgrid">
                  <span className="off">17:00</span>
                  <span>18:30</span>
                  <span className="pick">20:00</span>
                  <span className="off">21:30</span>
                  <span>23:00</span>
                  <span className="off">08:00</span>
                </div>
                <span className="btn block">Reservar 20:00 · $44.000</span>
              </div>
            </div>

            <div className="feature flip" data-reveal>
              <div className="copy">
                <p className="eyebrow">WhatsApp</p>
                <h3>Confirmación clara, sin escribir nada.</h3>
                <p>Al reservar, el jugador ve el resumen del turno y te lo manda por WhatsApp con un toque. Vos tenés su contacto en la agenda por si hay lluvia o un cambio.</p>
              </div>
              <div className="bubble-wrap" aria-label="Ejemplo de mensaje de WhatsApp">
                <div className="bubble me">
                  Hola! Reservé Cancha 1 (Fútbol 5) el viernes 23 de 21:00 a 22:00 a nombre de Juli Ramos.
                  <small>21:14</small>
                </div>
                <div className="bubble">
                  ¡Genial Juli! Te esperamos. Si llueve te avisamos por acá 🙌
                  <small>21:16</small>
                </div>
              </div>
            </div>

            <div className="feature" data-reveal>
              <div className="copy">
                <p className="eyebrow">Turnos fijos</p>
                <h3>Los de todas las semanas, cargados una sola vez.</h3>
                <p>El grupo del martes, la clase del jueves, el torneo de los domingos. Los cargás como fijos y quedan bloqueados para que nadie más los tome. Si un día no vienen, liberás solo esa fecha.</p>
              </div>
              <div className="fixed-list" aria-label="Ejemplo de turnos fijos">
                {[
                  ["Mar", "Los del laburo", "Cancha 1 · 21:00 a 22:00"],
                  ["Jue", "Clase Prof. Lucía", "Tenis · 18:00 a 19:00"],
                  ["Sáb", "Torneo interno", "Cancha 2 · 10:00 a 13:00"],
                  ["Dom", "Pádel de los domingos", "Pádel 1 · 19:00 a 20:30"],
                ].map(([d, n, s], i) => (
                  <div key={n} className="fixed-item" data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
                    <span className="day">{d}</span>
                    <div><b>{n}</b><span>{s}</span></div>
                    <span className="tag">Fijo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* COMO ARRANCAR */}
        <section className="section">
          <div className="container">
            <div className="section-head" data-reveal>
              <p className="eyebrow">Cómo arrancás</p>
              <h2>En marcha hoy mismo.</h2>
            </div>
            <div className="steps">
              <div className="step" data-reveal style={{ ["--d" as string]: "0ms" }}>
                <span className="n">1</span>
                <h3>Creá tu cuenta</h3>
                <p>Nombre del complejo, ciudad y WhatsApp. Nada más.</p>
              </div>
              <div className="step" data-reveal style={{ ["--d" as string]: "110ms" }}>
                <span className="n">2</span>
                <h3>Cargá tus canchas</h3>
                <p>Deporte, duración del turno, horario y precios de día y de noche.</p>
              </div>
              <div className="step" data-reveal style={{ ["--d" as string]: "220ms" }}>
                <span className="n">3</span>
                <h3>Compartí tu link</h3>
                <p>Ponelo en tu Instagram y en tu WhatsApp. Las reservas empiezan a caer solas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PLANES */}
        <section className="section" id="planes">
          <div className="container">
            <div className="section-head" data-reveal>
              <p className="eyebrow">Planes</p>
              <h2>Un precio fijo por mes. Sin comisiones por turno.</h2>
              <p>Probás {TRIAL_DAYS} días gratis con todas las funciones. Cuando termina la prueba no se cobra nada: elegís el plan según tus canchas.</p>
            </div>
            <Plans />
          </div>
        </section>

        {/* JUGADORES */}
        <section className="section">
          <div className="container">
            <div className="players" data-reveal>
              <div style={{ display: "grid", gap: 14 }}>
                <p className="eyebrow">Para jugadores</p>
                <h2>¿Buscás dónde jugar?</h2>
                <p className="muted" style={{ fontSize: 18 }}>Mirá los complejos que usan Córner, elegí horario y reservá en un minuto.</p>
              </div>
              <div className="players-cta">
                <Link href="/canchas" className="btn">Buscar cancha</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CIERRE */}
        <section className="section">
          <div className="container closing" data-reveal>
            <h2>Tu complejo, en orden desde hoy.</h2>
            <p className="muted" style={{ fontSize: 18 }}>Empezá tu prueba gratis de {TRIAL_DAYS} días.</p>
            <div>
              <div className="closing-ctas">
                <Link href="/registro" className="btn">Quiero mi agenda</Link>
                {contact && (
                  <a href={contact} className="btn ghost" target="_blank" rel="noreferrer">Escribinos por WhatsApp</a>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

type Cell = { n: string; s: string; k: string; lite?: boolean; cont?: boolean; live?: boolean } | null;
function Row({ row, rowIndex }: { row: { t: string; c: readonly Cell[] }; rowIndex: number }) {
  return (
    <>
      <div className="t">{row.t}</div>
      {row.c.map((c, i) => (
        <div className="cell" key={i}>
          {c && !c.cont && (
            <div className={`ev ${c.lite ? "lite" : ""} ${c.live ? "live" : ""}`} style={{ background: `var(--${c.k})`, ["--i" as string]: rowIndex * 3 + i }}>
              <b>{c.n}</b>
              <small>{c.s}</small>
            </div>
          )}
          {c && c.cont && <div className="ev" style={{ background: `var(--${c.k})`, opacity: 0.55, ["--i" as string]: rowIndex * 3 + i }} />}
        </div>
      ))}
    </>
  );
}
