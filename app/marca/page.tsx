import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Marca", description: "Logo, colores, tipografía y piezas de Córner para descargar." };

const LOGOS = [
  { file: "corner-logo", label: "Logo principal", dark: false },
  { file: "corner-logo-negativo", label: "Negativo", dark: true },
  { file: "corner-logo-vertical", label: "Vertical", dark: false },
  { file: "corner-isotipo", label: "Isotipo", dark: false },
  { file: "corner-logo-negro", label: "Un color negro", dark: false },
  { file: "corner-logo-blanco", label: "Un color blanco", dark: true },
];
const COLORS = [
  { n: "Tinta", h: "#0E0F0E", u: "Textos, fondos oscuros, botones" },
  { n: "Blanco", h: "#FFFFFF", u: "Fondos y texto sobre tinta" },
  { n: "Bandera", h: "#E3402A", u: "Acento. Usarlo poco." },
  { n: "Cemento", h: "#F4F4F2", u: "Fondos secundarios" },
  { n: "Línea", h: "#E3E3DF", u: "Bordes y separadores" },
  { n: "Grafito", h: "#6A6C68", u: "Texto secundario" },
  { n: "Césped", h: "#1F7A46", u: "Fútbol" },
  { n: "Pádel", h: "#1E5AA0", u: "Pádel" },
  { n: "Polvo de ladrillo", h: "#C0532A", u: "Tenis" },
];
const SOCIAL = [
  { file: "perfil-instagram-whatsapp.png", label: "Perfil 1080 × 1080" },
  { file: "post-organiza-tus-canchas.png", label: "Post 1080 × 1350" },
  { file: "post-en-3-pasos.png", label: "Post 1080 × 1350" },
  { file: "historia-tenes-un-complejo.png", label: "Historia 1080 × 1920" },
];

export default function Marca() {
  return (
    <>
      <SiteHeader />
      <main className="container brand-page">
        <section className="brand-hero" data-reveal>
          <p className="eyebrow">Marca</p>
          <h1>La esquina de la cancha, con su banderín.</h1>
          <p className="muted brand-lead">El isotipo de Córner dibuja el córner visto de costado: las dos líneas de cal, el arco y el banderín. Acá están el logo, los colores, la tipografía y las piezas para redes, listos para descargar.</p>
          <div className="closing-ctas" style={{ justifyContent: "flex-start" }}>
            <a className="btn" href="/marca/corner-branding-kit.zip" download>Descargar kit completo (.zip)</a>
            <a className="btn ghost" href="/marca/corner-guia-de-marca.pdf" target="_blank" rel="noreferrer">Ver guía de marca (PDF)</a>
          </div>
        </section>

        <section className="brand-sec" data-reveal>
          <h2>Logo</h2>
          <div className="brand-logos">
            {LOGOS.map((l) => (
              <figure key={l.file} className={`brand-tile ${l.dark ? "dark" : ""}`}>
                <img src={`/marca/${l.file}.svg`} alt={`${l.label} de Córner`} className={l.file.includes("isotipo") ? "iso" : l.file.includes("vertical") ? "vert" : ""} />
                <figcaption>
                  <b>{l.label}</b>
                  <span><a href={`/marca/${l.file}.svg`} download>SVG</a> · <a href={`/marca/${l.file}-800px.png`} download>PNG</a></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="brand-sec" data-reveal>
          <h2>Colores</h2>
          <div className="brand-colors">
            {COLORS.map((c) => (
              <div key={c.h} className="brand-color">
                <span style={{ background: c.h }} />
                <b>{c.n}</b>
                <code>{c.h}</code>
                <small className="muted">{c.u}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="brand-sec brand-type" data-reveal>
          <h2>Tipografía</h2>
          <div className="brand-type-grid">
            <p className="brand-specimen">Aa Ññ 0123</p>
            <div className="brand-type-list">
              <div><span className="eyebrow">Títulos</span><b style={{ fontFamily: "var(--display)", fontStretch: "112%", fontWeight: 800, fontSize: 28 }}>Archivo Expanded ExtraBold</b></div>
              <div><span className="eyebrow">Textos</span><b style={{ fontWeight: 400, fontSize: 20 }}>Archivo Regular</b></div>
              <div><span className="eyebrow">Etiquetas y botones</span><b style={{ fontWeight: 600, fontSize: 19 }}>Archivo SemiBold</b></div>
              <p className="muted small">Fuente libre (SIL Open Font License). Las tres variantes vienen en el kit para instalar.</p>
            </div>
          </div>
        </section>

        <section className="brand-sec" data-reveal>
          <h2>Para redes</h2>
          <div className="brand-social">
            {SOCIAL.map((s) => (
              <a key={s.file} href={`/marca/${s.file}`} download className="brand-shot">
                <img src={`/marca/${s.file}`} alt={s.label} loading="lazy" />
                <span>{s.label}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="brand-sec" data-reveal>
          <h2>Voz y tono</h2>
          <div className="brand-voice">
            <div className="voice yes"><span>Sí</span><p>“Tus jugadores reservan solos y vos ves todo en una grilla.”</p></div>
            <div className="voice no"><span>No</span><p>“Revolucionamos la gestión deportiva con una solución integral.”</p></div>
            <div className="voice yes"><span>Sí</span><p>“Ese turno se acaba de ocupar. Elegí otro horario.”</p></div>
            <div className="voice no"><span>No</span><p>“Error 409: conflicto de reserva.”</p></div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
