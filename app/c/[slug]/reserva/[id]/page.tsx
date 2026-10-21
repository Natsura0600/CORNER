import Logo from "@/components/Logo";
import ReservaClient from "./ReservaClient";

export const metadata = { title: "Mi reserva" };

export default async function ReservaPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { slug, id } = await params;
  const { t } = await searchParams;
  return (
    <>
      <header className="site-header"><div className="container"><Logo /></div></header>
      <main className="container" style={{ paddingBlock: "40px 80px", maxWidth: 560 }}>
        <ReservaClient id={id} token={t ?? ""} slug={slug} />
      </main>
    </>
  );
}
