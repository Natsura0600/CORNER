import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { getSession } from "@/lib/auth";
import { usingMemory } from "@/lib/kv";
import AdminClient from "./AdminClient";
import MailCard from "./MailCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Superadmin" };

export default async function AdminPage() {
  const s = await getSession();
  if (!s || s.role !== "superadmin") redirect("/login");
  return (
    <>
      <header className="site-header"><div className="container"><Logo href="/admin" /><span className="tag">Superadmin</span></div></header>
      <main className="container" style={{ paddingBlock: "32px 80px", display: "grid", gap: 22 }}>
        <h1 style={{ fontSize: 40 }}>Complejos</h1>
        {usingMemory && <p className="err">Ojo: no están configuradas las variables de Upstash. Los datos están en memoria y se pierden al reiniciar.</p>}
        <AdminClient />
        <MailCard />
      </main>
    </>
  );
}
