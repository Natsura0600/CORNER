import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import AuthForm from "@/components/AuthForm";
import { getSession } from "@/lib/auth";
import { sessionUser } from "@/lib/data";

export const metadata = { title: "Registrar mi complejo" };

export default async function Page({ searchParams }: { searchParams: Promise<{ vencida?: string }> }) {
  const { vencida } = await searchParams;
  const s = await getSession();
  if (s?.role === "superadmin") redirect("/admin");
  if (s && (await sessionUser(s))) redirect("/panel");
  return (
    <main className="container auth">
      <div style={{ display: "grid", gap: 24, justifyItems: "center", width: "100%" }}>
        <Logo />
        <AuthForm mode="registro" />
      </div>
    </main>
  );
}
