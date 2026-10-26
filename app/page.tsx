import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Flag } from "@/components/Logo";
import CourtMap from "@/components/landing/CourtMap";
import HowTo from "@/components/landing/HowTo";
import PriceCalc from "@/components/landing/PriceCalc";
import WaContact from "@/components/landing/WaContact";
import { CONTACT_WHATSAPP, TRIAL_DAYS, waLink } from "@/lib/config";

const TICKER = [
  "20:00 · Juan F. · Cancha 2",
  "20:30 · Sofi R. · Pádel 1",
  "21:00 · Nico B. · Tenis",
  "21:00 · Paula M. · Cancha 1",
  "22:00 · Los del laburo · Fijo",
  "23:00 · Agus T. · Pádel 2",
];

const FEATURES: { t: string; d: string; plan?: string }[] = [
  { t: "Página de reservas propia", d: "Tu link, con tus canchas y tus horarios." },
  { t: "Agenda en vivo", d: "Todas tus canchas en una grilla, con aviso y sonido." },
  { t: "Turnos fijos y bloqueos", d: "Los de todas las semanas, cargados una vez." },
  { t: "Confirmación por WhatsApp", d: "El jugador te manda el resumen con un toque." },
  { t: "Turnos de 60 o 90 minutos", d: "Cada cancha con la duración que corresponde." },
  { t: "Cancelación online", d: "Con el plazo que vos definas." },
  { t: "Tarifa diurna y nocturna", d: "La luz se cobra sola, sin hacer cuentas.", plan: "Club" },
  { t: "Estadísticas", d: "Ocupación y facturación del día.", plan: "Club" },
  { t: "Tu logo, color y portada", d: "Tu página con la cara de tu complejo.", plan: "Club" },
  { t: "Exportar a Excel", d: "Todas tus reservas, para tu contador.", plan: "Pro" },
];

const FIJOS = [
  ["Mar", "Los del laburo", "Cancha 1 · 21:00 a 22:00"],
  ["Jue", "Clase Prof. Lucía", "Tenis · 18:00 a 19:00"],
  ["Dom", "Pádel de los domingos", "Pádel 1 · 19:00 a 20:30"],
];

export default function Home() {
  const contact = CONTACT_WHATSAPP ? waLink(CONTACT_WHATSAPP, "¡Hola! Tengo un complejo y quiero saber más de Córner") : null;
  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="hero lp-hero">
          <div className="container">
            <div className="hero-copy">
              <p className="eyebrow">Turnos online para fútbol, pádel y tenis</p>
              <h1 style={{ marginTop: 16 }}>
                Organizá tus canchas.<br />
                <em className="flag">Llená tus turnos.</em>
              </h1>
              <p className="lead">
                Córner es la agenda online de tu complejo. Tus jugadores reservan solos desde el celular, a cualquier hora, y vos ves todo en una sola grilla. Sin planillas ni audios a las dos de la mañana.
              </p>
              <div className="ctas">
                <Link href="/registro" className="btn">Probar {TRIAL_DAYS} días gratis</Link>
                <Link href="#como" className="btn ghost">Ver cómo funciona</Link>
              </div>
              <p className="note">Sin tarjeta. Lo configurás en 10 minutos.</p>
            </div>
            <CourtMap />
          </div>
        </section>

        <div className="lp-ticker" aria-hidden="true">
          <div className="lp-ticker-track">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i}><svg width="11" height="11" viewBox="0 0 12 12"><path d="M0 0 L12 6 L0 12 Z" /></svg>{t}</span>
            ))}
          </div>
        </div>

        {/* EL PANEL */}
        <section className="section lp-first" id="como">
          <div className="container">
            <div className="section-head" data-reveal>
              <p className="eyebrow">El panel</p>
              <h2>Tu tarde, <em className="flag">en una grilla.</em></h2>
              <p>Las reservas de la web entran solas y suenan en el panel. Lo que llega por mostrador o teléfono lo cargás vos en tres toques.</p>
            </div>
            <div data-reveal><HowTo /></div>
          </div>
        </section>

        {/* TU PAGINA */}
        <section className="section lp-soft">
          <div className="container feature" data-reveal>
            <div className="copy">
              <p className="eyebrow">Tu página de reservas</p>
              <h2 className="lp-h">Tu link. <em className="flag">Tus jugadores.</em></h2>
              <p>Cada complejo tiene su propia página, con tu nombre, tu color y tus canchas. La compartís en Instagram y WhatsApp y las reservas empiezan a caer.</p>
              <ol className="lp-numbered">
                <li><span className="n">01</span><div><b>Elige deporte y día</b><p>Fútbol, pádel o tenis. Ve los días de la semana de un vistazo.</p></div></li>
                <li><span className="n">02</span><div><b>Toca un horario libre</b><p>Los ocupados aparecen tachados. Nunca se reserva dos veces el mismo turno.</p></div></li>
                <li><span className="n">03</span><div><b>Deja nombre y WhatsApp</b><p>Sin crear cuenta ni bajar una app. Tarda menos de un minuto.</p></div></li>
                <li><span className="n">04</span><div><b>Te lo confirma por WhatsApp</b><p>Con un toque te manda el resumen del turno. Vos tenés su contacto en la agenda.</p></div></li>
              </ol>
            </div>
            <div className="phone lp-phone" aria-label="Ejemplo de la página de reservas en el celular">
              <div className="lp-phone-head">
                <span>Fútbol · Pádel · Tenis</span>
                <b>El Potrero</b>
              </div>
              <div className="lp-phone-body">
                <div className="row">
                  <span className="chip">Fútbol 5</span>
                  <span className="chip on">Pádel</span>
                  <span className="chip">Tenis</span>
                </div>
                <div className="lp-days">
                  {[["Jue", "22"], ["Vie", "23"], ["Sáb", "24"], ["Dom", "25"], ["Lun", "26"]].map(([d, n]) => (
                    <span key={n} className={n === "23" ? "on" : ""}><small>{d}</small><b>{n}</b></span>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <b>Pádel 1 · techada</b>
                  <span className="muted small">turnos de 90 min</span>
                </div>
                <div className="slotgrid">
                  <span className="off">17:00</span>
                  <span className="off">18:30</span>
                  <span className="pick">20:00</span>
                  <span>21:30</span>
                  <span>23:00</span>
                  <span className="off">08:00</span>
                </div>
                <span className="btn block lp-venue-btn">Reservar 20:00 · $44.000</span>
              </div>
            </div>
          </div>
        </section>

        {/* WHATSAPP + FIJOS */}
        <section className="section">
          <div className="container">
            <div className="section-head" data-reveal>
              <p className="eyebrow">Sin idas y vueltas</p>
              <h2>Menos teléfono. <em className="flag">Más canchas ocupadas.</em></h2>
            </div>
            <div className="lp-duo">
              <div className="card lp-duo-card" data-reveal>
                <div className="copy">
                  <p className="eyebrow">WhatsApp</p>
                  <h3>Confirmación clara, sin escribir nada.</h3>
                  <p className="muted">Al reservar, el jugador te manda el resumen del turno con un toque. Si llueve, ya tenés su contacto.</p>
                </div>
                <div className="bubble-wrap lp-chat" aria-label="Ejemplo de mensaje de WhatsApp">
                  <div className="bubble me">
                    Hola! Reservé Cancha 1 (Fútbol 5) el viernes 23 de 21:00 a 22:00 a nombre de Juli Ramos.
                    <small>21:14</small>
                  </div>
                  <div className="bubble">
                    ¡Genial Juli! Te esperamos. Si llueve te avisamos por acá.
                    <small>21:16</small>
                  </div>
                </div>
              </div>
              <div className="card lp-duo-card" data-reveal style={{ ["--d" as string]: "110ms" }}>
                <div className="copy">
                  <p className="eyebrow">Turnos fijos</p>
                  <h3>Los de siempre, cargados una vez.</h3>
                  <p className="muted">Quedan bloqueados todas las semanas. Si un día no vienen, liberás solo esa fecha.</p>
                </div>
                <div className="fixed-list">
                  {FIJOS.map(([d, n, s]) => (
                    <div key={n} className="fixed-item">
                      <span className="day">{d}</span>
                      <div><b>{n}</b><span>{s}</span></div>
                      <span className="tag">Fijo</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FUNCIONES */}
        <section className="section lp-dark" id="funciones">
          <div className="container">
            <div className="lp-dark-head" data-reveal>
              <h2 className="lp-h">¿Qué incluye <em>Córner?</em></h2>
              <p>Diez funciones pensadas para cómo trabaja un complejo en serio. Las marcadas con plan se suman en Club o Pro.</p>
            </div>
            <ol className="lp-feats">
              {FEATURES.map((f, i) => (
                <li key={f.t} data-reveal style={{ ["--d" as string]: `${(i % 2) * 90}ms` }}>
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <div><b>{f.t}</b><span>{f.d}</span></div>
                  {f.plan && <span className="lp-plan-tag">{f.plan}</span>}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* COMO ARRANCAR */}
        <section className="section lp-first">
          <div className="container">
            <div className="section-head" data-reveal>
              <p className="eyebrow">Cómo arrancás</p>
              <h2>¿Cómo se <em className="flag">empieza?</em></h2>
              <p>Creás tu cuenta, cargás tus canchas y compartís tu link. En marcha hoy mismo.</p>
            </div>
            <div className="lp-start">
              <div data-reveal style={{ ["--d" as string]: "0ms" }}>
                <div className="lp-start-art">
                  <span className="lp-label">Nombre del complejo</span>
                  <span className="lp-fake-input on">El Potrero</span>
                  <span className="lp-label">WhatsApp</span>
                  <span className="lp-fake-input muted">+54 9 …</span>
                </div>
                <div className="step"><span className="n">1</span><h3>Creá tu cuenta</h3><p>Nombre del complejo, ciudad y WhatsApp. Nada más.</p></div>
              </div>
              <div data-reveal style={{ ["--d" as string]: "110ms" }}>
                <div className="lp-start-art">
                  <span className="lp-fake-input"><span><i className="dot" style={{ background: "var(--futbol)" }} /> Cancha 1 · F5</span><span className="muted">60 min</span></span>
                  <span className="lp-fake-input"><span><i className="dot" style={{ background: "var(--padel)" }} /> Pádel 1</span><span className="muted">90 min</span></span>
                  <span className="lp-fake-input dashed muted">+ Agregar cancha</span>
                </div>
                <div className="step"><span className="n">2</span><h3>Cargá tus canchas</h3><p>Deporte, duración del turno, horario y precios de día y de noche.</p></div>
              </div>
              <div data-reveal style={{ ["--d" as string]: "220ms" }}>
                <div className="lp-start-art">
                  <span className="linkbox"><code>cornerapp.com.ar/c/elpotrero</code><span className="btn sm" aria-hidden="true">Copiar</span></span>
                  <span className="lp-first-res"><b>1.ª</b><span><b>Primera reserva</b><span className="muted">Cancha 1 · jueves 20:00</span></span></span>
                </div>
                <div className="step"><span className="n">3</span><h3>Compartí tu link</h3><p>Ponelo en tu Instagram y en tu WhatsApp. Las reservas empiezan a caer solas.</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* PRECIOS */}
        <section className="section lp-soft" id="planes">
          <div className="container" data-reveal>
            <PriceCalc />
          </div>
        </section>

        {/* CONFIANZA + CONTACTO */}
        <section className="section lp-first">
          <div className="container lp-trust">
            <div className="lp-trust-copy" data-reveal>
              <h2 className="lp-h">Hecho en <em className="flag">Luján.</em></h2>
              <p className="lp-lead">Córner lo hace un equipo chico que también atiende el soporte. Le escribís a quien lo programa.</p>
              <div className="lp-trust-grid">
                <div><b>Precio a la vista.</b><span>Publicado y en pesos. No hace falta hablar con un vendedor.</span></div>
                <div><b>Sin comisiones.</b><span>Pagás un fijo por mes, no un porcentaje de cada turno.</span></div>
                <div><b>Soporte por WhatsApp.</b><span>Y en Pro, te ayudamos a dejarlo andando.</span></div>
                <div><b>La prueba no se cobra.</b><span>Si no te sirve, no pagás nada.</span></div>
              </div>
            </div>
            <div data-reveal style={{ ["--d" as string]: "110ms" }}>
              <WaContact number={CONTACT_WHATSAPP} />
            </div>
          </div>
        </section>

        {/* CIERRE */}
        <section className="section">
          <div className="container closing" data-reveal>
            <span className="lp-closing-flag"><Flag size={60} /></span>
            <h2>Tu complejo, <em className="flag">en orden desde hoy.</em></h2>
            <p className="muted" style={{ fontSize: 18 }}>Probá Córner {TRIAL_DAYS} días gratis con tus canchas. Sin tarjeta.</p>
            <div className="closing-ctas">
              <Link href="/registro" className="btn">Quiero mi agenda</Link>
              {contact && (
                <a href={contact} className="btn ghost" target="_blank" rel="noreferrer">Hablar por WhatsApp</a>
              )}
            </div>
          </div>
        </section>

        {/* JUGADORES */}
        <section className="lp-players-sec">
          <div className="container">
            <div className="players" data-reveal>
              <div style={{ display: "grid", gap: 14 }}>
                <p className="eyebrow">Para jugadores · gratis</p>
                <h2>¿Jugás? <em className="flag">Buscá dónde jugar.</em></h2>
                <p className="muted" style={{ fontSize: 18 }}>Mirá los complejos que usan Córner, elegí horario y reservá en un minuto.</p>
              </div>
              <div className="players-cta">
                <Link href="/canchas" className="btn">Buscar cancha</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
