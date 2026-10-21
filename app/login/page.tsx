import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import AuthForm from "@/components/AuthForm";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Ingresar" };

export default async function Page() {
  const s = await getSession();
  if (s) redirect(s.role === "superadmin" ? "/admin" : "/panel");
  return (
    <main className="container auth">
      <div style={{ display: "grid", gap: 24, justifyItems: "center", width: "100%" }}>
        <Logo />
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
