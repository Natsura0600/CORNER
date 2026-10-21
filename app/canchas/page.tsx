import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCourts, listComplejos } from "@/lib/data";
import { SPORTS, type Sport } from "@/lib/types";
import { sportColor } from "@/lib/sport";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buscar cancha" };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export default async function Canchas({ searchParams }: { searchParams: Promise<{ ciudad?: string; deporte?: string }> }) {
  const sp = await searchParams;
  const ciudad = sp.ciudad ?? "";
  const deporte = sp.deporte ?? "";
  const all = (await listComplejos()).filter((c) => c.active);
  const withCourts = await Promise.all(all.map(async (c) => ({ c, courts: await getCourts(c.id) })));
  const groups = (s: Sport) => SPORTS[s].group;
  const list = withCourts.filter(({ c, courts }) => {
    if (!courts.length) return false;
    if (ciudad && !norm(c.city).includes(norm(ciudad))) return false;
    if (deporte && !courts.some((k) => groups(k.sport) === deporte)) return false;
    return true;
  });
  const cities = [...new Set(withCourts.filter((x) => x.courts.length).map((x) => x.c.city))].sort();

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

        {list.length === 0 ? (
          <div className="empty">
            <h3>No encontramos complejos con esa búsqueda.</h3>
            <p className="muted">Probá con otra ciudad o con todos los deportes.</p>
            <Link href="/canchas" className="btn ghost sm">Ver todos</Link>
          </div>
        ) : (
          <div className="dir-grid">
            {list.map(({ c, courts }) => {
              const sports = [...new Set(courts.map((k) => k.sport))];
              return (
                <Link key={c.id} href={`/c/${c.slug}`} className="venue-card">
                  <span className="eyebrow">{c.city}</span>
                  <h3>{c.name}</h3>
                  {c.address && <span className="muted small">{c.address}</span>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {sports.map((s) => (
                      <span key={s} className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <i className="dot" style={{ background: sportColor(s) }} />
                        {SPORTS[s].label} · {courts.filter((k) => k.sport === s).length}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontWeight: 600 }}>Ver horarios →</span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
