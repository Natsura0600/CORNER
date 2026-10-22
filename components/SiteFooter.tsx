import Link from "next/link";
import Logo from "./Logo";
import { CONTACT_WHATSAPP, waLink } from "@/lib/config";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <Logo />
        <nav aria-label="Pie de página">
          <Link href="/canchas">Buscar cancha</Link>
          <Link href="/#planes">Planes</Link>
          <Link href="/registro">Registrar mi complejo</Link>
          <Link href="/terminos">Términos</Link>
          <Link href="/privacidad">Privacidad</Link>
          {CONTACT_WHATSAPP && (
            <a href={waLink(CONTACT_WHATSAPP, "Hola! Quiero saber más de Córner")} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
        </nav>
        <span>© {new Date().getFullYear()} Córner</span>
      </div>
    </footer>
  );
}
