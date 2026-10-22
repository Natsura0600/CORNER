import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import AuthForm from "@/components/AuthForm";
import { getSession } from "@/lib/auth";
import { sessionUser } from "@/lib/data";

export const metadata = { title: "Ingresar" };

export default async function Page({ searchParams }: { searchParams: Promise<{ vencida?: string }> }) {
  const { vencida } = await searchParams;
  const s = await getSession();
  if (s?.role === "superadmin") redirect("/admin");
  if (s && (await sessionUser(s))) redirect("/panel");
  return (
    <main className="container auth">
      <div style={{ display: "grid", gap: 24, justifyItems: "center", width: "100%" }}>
        <Logo />
        {vencida && <p className="banner warn" style={{ maxWidth: 440 }}>Tu sesión se cerró. Si cambiaste el email o la contraseña, ingresá con los datos nuevos.</p>}
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
