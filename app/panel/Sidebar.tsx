"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";

const LINKS = [
  { href: "/panel", label: "Agenda" },
  { href: "/panel/canchas", label: "Canchas" },
  { href: "/panel/ajustes", label: "Ajustes" },
];

export default function Sidebar({ name, email, slug, active }: { name: string; email: string; slug: string; active: boolean }) {
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
        {!active && <span className="pill off">Cuenta suspendida</span>}
        <span style={{ overflowWrap: "anywhere" }}>{email}</span>
        <button className="linkbtn" style={{ justifySelf: "start" }} onClick={logout}>Cerrar sesión</button>
      </div>
    </aside>
  );
}
