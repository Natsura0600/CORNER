"use client";
import { useCallback, useEffect, useState } from "react";

type State = "cargando" | "sin-soporte" | "ios-instalar" | "bloqueado" | "apagado" | "activo";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function urlB64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

function deviceLabel() {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Otro";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return [os, br].filter(Boolean).join(" · ");
}

const isIOS = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

/** Registra el service worker del panel (una vez por carga) */
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

/** Tarjeta para instalar la app y activar los avisos en este dispositivo */
export default function PushSetup({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("cargando");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [install, setInstall] = useState<BIPEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) return setState(isIOS() && !isStandalone() ? "ios-instalar" : "sin-soporte");
    if (Notification.permission === "denied") return setState("bloqueado");
    const reg = await navigator.serviceWorker.register("/sw.js");
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return setState("apagado");
    const r = await fetch("/api/push/subscribe", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
    const j = await r.json().catch(() => ({}));
    setState(j.active ? "activo" : "apagado");
  }, []);

  useEffect(() => {
    check().catch(() => setState("sin-soporte"));
    try { setDismissed(localStorage.getItem("corner_push_hide") === "1"); } catch {}
    const onBIP = (e: Event) => { e.preventDefault(); setInstall(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, [check]);

  async function enable() {
    setBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState(perm === "denied" ? "bloqueado" : "apagado"); return; }
      const reg = await navigator.serviceWorker.ready;
      const { key } = await (await fetch("/api/push/key")).json();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(key) }));
      const r = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON(), label: deviceLabel() }) });
      if (!r.ok) throw new Error();
      setState("activo");
      setMsg("Listo. Te mandamos un aviso de prueba.");
      fetch("/api/push/test", { method: "POST" }).catch(() => {});
    } catch {
      setMsg("No se pudieron activar los avisos. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe().catch(() => {});
    }
    setBusy(false);
    setState("apagado");
    setMsg("");
  }

  async function test() {
    setMsg("");
    const r = await fetch("/api/push/test", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setMsg(j.sent ? "Aviso de prueba enviado." : "No hay dispositivos con avisos activos.");
  }

  async function doInstall() {
    if (!install) return;
    await install.prompt();
    await install.userChoice.catch(() => null);
    setInstall(null);
  }

  if (state === "cargando" || state === "sin-soporte") return null;
  if (compact && (state === "activo" || dismissed)) return null;

  return (
    <section className={`card push-card ${compact ? "compact" : ""}`} aria-labelledby="push-h">
      <div className="push-head">
        <span className="push-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
        </span>
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <b id="push-h">{state === "activo" ? "Avisos activados en este dispositivo" : "Recibí las reservas en el celular"}</b>
          <span className="muted small">
            {state === "activo" && "Cuando alguien reserve o cancele te llega una notificación, aunque no tengas el panel abierto."}
            {state === "apagado" && "Te llega una notificación cada vez que un jugador reserva o cancela, sin tener el panel abierto."}
            {state === "bloqueado" && "Los avisos están bloqueados para este sitio. Habilitalos desde la configuración del navegador (ícono del candado, al lado de la dirección) y recargá."}
            {state === "ios-instalar" && "En iPhone primero instalá la app: tocá Compartir y después “Agregar a inicio”. Abrí Córner desde ese ícono y activá los avisos."}
          </span>
        </div>
        {compact && <button className="x" onClick={() => { setDismissed(true); try { localStorage.setItem("corner_push_hide", "1"); } catch {} }} aria-label="Ocultar">×</button>}
      </div>
      <div className="push-actions">
        {state === "apagado" && <button className="btn sm" onClick={enable} disabled={busy}>{busy ? "Activando…" : "Activar avisos"}</button>}
        {state === "activo" && !compact && (
          <>
            <button className="btn sm ghost" onClick={test}>Mandar aviso de prueba</button>
            <button className="btn sm ghost" onClick={disable} disabled={busy}>Desactivar en este dispositivo</button>
          </>
        )}
        {install && !isStandalone() && <button className="btn sm ghost" onClick={doInstall}>Instalar la app</button>}
      </div>
      {msg && <p className="okmsg small" role="status">{msg}</p>}
    </section>
  );
}
