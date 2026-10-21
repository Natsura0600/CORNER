import { notFound } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getComplejoBySlug, getCourts } from "@/lib/data";
import { addDays, todayStr } from "@/lib/time";
import { SPORTS } from "@/lib/types";
import BookingClient from "./BookingClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getComplejoBySlug(slug);
  return { title: c ? `Reservá en ${c.name}` : "Complejo" };
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getComplejoBySlug(slug);
  if (!c) notFound();
  const courts = c.active ? await getCourts(c.id) : [];
  const today = todayStr();
  const days = Array.from({ length: c.daysAhead + 1 }, (_, i) => addDays(today, i));
  const groups = [...new Set(courts.map((k) => SPORTS[k.sport].group))];

  return (
    <>
      <header className="site-header">
        <div className="container">
          <Logo />
          <nav><Link href="/canchas">Otros complejos</Link></nav>
        </div>
      </header>
      <main className="container" style={{ paddingBottom: 80 }}>
        <div className="venue-head">
          <p className="eyebrow">{[c.city, c.address].filter(Boolean).join(" · ")}</p>
          <h1>{c.name}</h1>
        </div>
        {!c.active ? (
          <div className="empty">
            <h3>Este complejo no está tomando reservas online por ahora.</h3>
            <p className="muted">Escribiles directamente por WhatsApp: {c.whatsapp}</p>
          </div>
        ) : courts.length === 0 ? (
          <div className="empty">
            <h3>Todavía no hay canchas cargadas.</h3>
            <p className="muted">Volvé en unos días o escribile al complejo: {c.whatsapp}</p>
          </div>
        ) : (
          <BookingClient
            venue={{ slug: c.slug, name: c.name, whatsapp: c.whatsapp, cancelHours: c.cancelHours }}
            days={days}
            groups={groups}
          />
        )}
      </main>
    </>
  );
}
