"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { CONTACT_EMAIL } from "@/lib/config";

const LINKS = [
  { href: "/panel", label: "Agenda" },
  { href: "/panel/canchas", label: "Canchas" },
  { href: "/panel/diseno", label: "Diseño" },
  { href: "/panel/ajustes", label: "Ajustes y plan" },
];

export default function Sidebar({ name, email, slug, planText, state }: { name: string; email: string; slug: string; planText: string; state: string }) {
  const path = usePathname();
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <aside className="sidebar">
      <Logo href="/panel" />
      <nav className="sidenav" aria-label="Panel">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "on" : ""}>{l.label}</Link>
        ))}
        <a href={`/c/${slug}`} target="_blank" rel="noreferrer">Mi página ↗</a>
      </nav>
      <div className="who">
        <b style={{ color: "var(--ink)" }}>{name}</b>
        <Link href="/panel/ajustes" className={`pill ${state === "vencido" || state === "suspendido" ? "off" : state === "prueba" ? "warn" : "on"}`} style={{ justifySelf: "start", textDecoration: "none" }}>{planText}</Link>
        <span style={{ overflowWrap: "anywhere" }}>{email}</span>
        <span>¿Ayuda? <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--ink)" }}>{CONTACT_EMAIL}</a></span>
        <button className="linkbtn" style={{ justifySelf: "start" }} onClick={logout}>Cerrar sesión</button>
      </div>
    </aside>
  );
}
