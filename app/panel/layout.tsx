import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getComplejo } from "@/lib/data";
import Sidebar from "./Sidebar";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role === "superadmin") redirect("/admin");
  const c = s.cid ? await getComplejo(s.cid) : null;
  if (!c) redirect("/login");
  return (
    <div className="panel-shell">
      <Sidebar name={c.name} email={s.email} slug={c.slug} active={c.active} />
      <main className="panel-main">{children}</main>
    </div>
  );
}
