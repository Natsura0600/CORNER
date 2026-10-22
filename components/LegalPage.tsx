import Link from "next/link";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { LEGAL } from "@/lib/config";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="container legal">
        <p className="eyebrow">Legal · Actualizado el {LEGAL.updated}</p>
        <h1>{title}</h1>
        <nav className="legal-switch" aria-label="Documentos legales">
          <Link href="/terminos">Términos y condiciones</Link>
          <Link href="/privacidad">Política de privacidad</Link>
        </nav>
        <div className="legal-body">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
