import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container" style={{ paddingBlock: 80 }}>
        <div className="empty">
          <h3>Esta página no existe.</h3>
          <p className="muted">Puede que el link esté mal escrito o que el complejo haya cambiado su dirección.</p>
          <Link href="/canchas" className="btn">Buscar cancha</Link>
        </div>
      </main>
    </>
  );
}
