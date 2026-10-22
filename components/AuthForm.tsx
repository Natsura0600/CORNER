"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TRIAL_DAYS } from "@/lib/config";

export default function AuthForm({ mode }: { mode: "login" | "registro" }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      router.push(mode === "registro" ? "/panel/canchas?nuevo=1" : j.redirect || "/panel");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error && e.message ? e.message : "Algo salió mal. Probá de nuevo.");
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div style={{ display: "grid", gap: 8 }}>
        <h1>{mode === "login" ? "Ingresá a tu complejo" : "Creá tu cuenta"}</h1>
        <p className="muted">{mode === "login" ? "Con el email y la contraseña con los que te registraste." : `${TRIAL_DAYS} días gratis, sin tarjeta.`}</p>
      </div>
      <form className="form" onSubmit={submit}>
        {mode === "registro" && (
          <>
            <label className="field"><span>Nombre del complejo</span><input id="r-complejo" name="complejo" required minLength={3} placeholder="Ej: Complejo El Ombú" /></label>
            <div className="grid2">
              <label className="field"><span>Ciudad</span><input id="r-city" name="city" required placeholder="Ej: Luján" /></label>
              <label className="field"><span>WhatsApp del complejo</span><input id="r-wa" name="whatsapp" required inputMode="tel" placeholder="11 5555 0000" /></label>
            </div>
          </>
        )}
        <label className="field"><span>Email</span><input id="a-email" name="email" type="email" required autoComplete="email" /></label>
        <label className="field">
          <span>Contraseña</span>
          <input id="a-pass" name="password" type="password" required minLength={mode === "registro" ? 8 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          {mode === "registro" && <small>Mínimo 8 caracteres.</small>}
        </label>
        {mode === "registro" && (
          <label className="check">
            <input id="r-terms" type="checkbox" name="terms" required />
            <span>Acepto los <Link href="/terminos" target="_blank">términos y condiciones</Link> y la <Link href="/privacidad" target="_blank">política de privacidad</Link>.</span>
          </label>
        )}
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn block" disabled={busy}>{busy ? "Un momento…" : mode === "login" ? "Ingresar" : "Crear mi cuenta"}</button>
      </form>
      <p className="muted small" style={{ textAlign: "center" }}>
        {mode === "login" ? <>¿Todavía no tenés cuenta? <Link href="/registro">Registrá tu complejo</Link></> : <>¿Ya tenés cuenta? <Link href="/login">Ingresá</Link></>}
      </p>
    </div>
  );
}
