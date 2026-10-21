import Link from "next/link";
import Logo from "./Logo";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container">
        <Logo />
        <nav aria-label="Principal">
          <Link href="/canchas" className="hide-sm">Buscar cancha</Link>
          <Link href="/#planes" className="hide-sm">Planes</Link>
          <Link href="/login">Ingresar</Link>
          <Link href="/registro" className="btn sm">Probalo gratis</Link>
        </nav>
      </div>
    </header>
  );
}
