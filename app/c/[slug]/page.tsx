import { notFound } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import VenueHeader, { venueVars } from "@/components/VenueHeader";
import { getComplejoBySlug, getCourts, visibleCourts } from "@/lib/data";
import { planStatus } from "@/lib/plans";
import { effectiveTheme } from "@/lib/theme";
import { addDays, todayStr } from "@/lib/time";
import { SPORTS } from "@/lib/types";
import BookingClient from "./BookingClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getComplejoBySlug(slug);
  if (!c) return { title: "Complejo" };
  return { title: `Reservá en ${c.name}`, description: c.theme?.description || `Turnos online en ${c.name}, ${c.city}.` };
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getComplejoBySlug(slug);
  if (!c) notFound();
  const st = planStatus(c);
  const theme = effectiveTheme(c.theme, st.features);
  const courts = st.operating ? visibleCourts(await getCourts(c.id), st.courts) : [];
  const today = todayStr();
  const days = Array.from({ length: c.daysAhead + 1 }, (_, i) => addDays(today, i));
  const groups = [...new Set(courts.map((k) => SPORTS[k.sport].group))];
  const logoUrl = theme.logoV ? `/api/img/${c.id}/logo?v=${theme.logoV}` : undefined;
  const coverUrl = theme.coverV ? `/api/img/${c.id}/cover?v=${theme.coverV}` : undefined;

  return (
    <div className="venue" style={venueVars(theme)}>
      <div className="venue-top">
        <div className="container">
          <Logo />
          <nav><Link href="/canchas">Otros complejos</Link></nav>
        </div>
      </div>
      <VenueHeader name={c.name} place={[c.city, c.address].filter(Boolean).join(" · ")} theme={theme} logoUrl={logoUrl} coverUrl={coverUrl} whatsapp={c.whatsapp} />
      <main className="container" style={{ paddingBlock: "28px 80px" }}>
        {!st.operating ? (
          <div className="empty">
            <h3>Este complejo no está tomando reservas online por ahora.</h3>
            <p className="muted">Escribiles directamente por WhatsApp para reservar.</p>
          </div>
        ) : courts.length === 0 ? (
          <div className="empty">
            <h3>Todavía no hay canchas cargadas.</h3>
            <p className="muted">Volvé en unos días o escribile al complejo por WhatsApp.</p>
          </div>
        ) : (
          <BookingClient venue={{ slug: c.slug, name: c.name, whatsapp: c.whatsapp, cancelHours: c.cancelHours }} days={days} groups={groups} />
        )}
      </main>
      <footer className="site-footer">
        <div className="container">
          <span>Reservas con <Link href="/">Córner</Link></span>
          <nav><Link href="/terminos">Términos</Link><Link href="/privacidad">Privacidad</Link></nav>
        </div>
      </footer>
    </div>
  );
}
