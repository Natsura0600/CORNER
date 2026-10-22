import Link from "next/link";
import { unstable_cache } from "next/cache";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { readDirectory, type DirEntry } from "@/lib/data";
import { has, planStatus } from "@/lib/plans";
import { SPORTS, type Complejo, type Sport } from "@/lib/types";
import { sportColor } from "@/lib/sport";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buscar cancha", description: "Complejos de fútbol, pádel y tenis con turnos online. Elegí horario y reservá en un minuto." };

/** El directorio se guarda en caché 5 minutos y se renueva solo cuando un complejo cambia algo. */
const cachedDirectory = unstable_cache(readDirectory, ["directorio-v1"], { revalidate: 300, tags: ["directorio"] });

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const PAGE = 24;

export default async function Canchas({ searchParams }: { searchParams: Promise<{ ciudad?: string; deporte?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const ciudad = sp.ciudad ?? "";
  const deporte = sp.deporte ?? "";
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const all = await cachedDirectory();
  const now = Date.now();

  // Solo complejos que hoy pueden tomar reservas, con sus canchas habilitadas por el plan
  const live = all
    .map((e) => {
      const st = planStatus(e as unknown as Complejo, now);
      return { e, st, sports: e.sports.slice(0, st.courts) };
    })
    .filter(({ st, sports }) => st.operating && sports.length > 0);

  const list = live
    .filter(({ e, sports }) => (!ciudad || norm(e.city).includes(norm(ciudad))) && (!deporte || sports.some((s) => SPORTS[s].group === deporte)))
    .sort((a, b) => a.e.city.localeCompare(b.e.city, "es") || a.e.name.localeCompare(b.e.name, "es"));
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice((pagina - 1) * PAGE, pagina * PAGE);
  const cities = [...new Set(live.map((x) => x.e.city))].sort((a, b) => a.localeCompare(b, "es"));
  const qs = (p: number) => `/canchas?${new URLSearchParams({ ...(ciudad && { ciudad }), ...(deporte && { deporte }), pagina: String(p) })}`;

  return (
    <>
      <SiteHeader />
      <main className="container" style={{ paddingBlock: "40px 80px", display: "grid", gap: 28 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <p className="eyebrow">Para jugadores</p>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 58px)" }}>Encontrá cancha y reservá.</h1>
        </div>
        <form className="card" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end" }}>
          <label className="field" style={{ flex: "1 1 220px" }}>
            <span>Ciudad</span>
            <input name="ciudad" defaultValue={ciudad} placeholder="Ej: Luján" list="ciudades" />
            <datalist id="ciudades">{cities.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label className="field" style={{ flex: "1 1 180px" }}>
            <span>Deporte</span>
            <select name="deporte" defaultValue={deporte}>
              <option value="">Todos</option>
              <option value="futbol">Fútbol</option>
              <option value="padel">Pádel</option>
              <option value="tenis">Tenis</option>
            </select>
          </label>
          <button className="btn" type="submit">Buscar</button>
        </form>

        {list.length > 0 && <p className="muted small">{list.length} complejo{list.length === 1 ? "" : "s"}{ciudad ? ` en ${ciudad}` : ""}</p>}

        {list.length === 0 ? (
          <div className="empty">
            <h3>No encontramos complejos con esa búsqueda.</h3>
            <p className="muted">Probá con otra ciudad o con todos los deportes.</p>
            <Link href="/canchas" className="btn ghost sm">Ver todos</Link>
          </div>
        ) : (
          <div className="dir-grid">
            {shown.map(({ e, st, sports }) => (
              <VenueCard key={e.id} e={e} sports={sports} showLogo={has(st, "logo") && !!e.logoV} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav className="pager" aria-label="Páginas">
            {pagina > 1 && <Link className="btn ghost sm" href={qs(pagina - 1)}>Anterior</Link>}
            <span className="muted small">Página {pagina} de {pages}</span>
            {pagina < pages && <Link className="btn ghost sm" href={qs(pagina + 1)}>Siguiente</Link>}
          </nav>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function VenueCard({ e, sports, showLogo }: { e: DirEntry; sports: Sport[]; showLogo: boolean }) {
  const kinds = [...new Set(sports)];
  return (
    <Link href={`/c/${e.slug}`} className="venue-card" style={e.accent ? { ["--card-accent" as string]: e.accent } : undefined}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {showLogo && <img src={`/api/img/${e.id}/logo?v=${e.logoV}`} alt="" width={44} height={44} className="vlogo" style={{ width: 44, height: 44, borderRadius: 12 }} />}
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <span className="eyebrow">{e.city}</span>
          <h3>{e.name}</h3>
        </div>
      </div>
      {e.address && <span className="muted small">{e.address}</span>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {kinds.map((s) => (
          <span key={s} className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <i className="dot" style={{ background: sportColor(s) }} />
            {SPORTS[s].label} · {sports.filter((k) => k === s).length}
          </span>
        ))}
      </div>
      <span style={{ fontWeight: 600 }}>Ver horarios →</span>
    </Link>
  );
}
