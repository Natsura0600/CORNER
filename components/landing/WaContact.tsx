"use client";
import { useState } from "react";
import { CONTACT_EMAIL, waLink } from "@/lib/config";

/** Formulario que arma el mensaje de WhatsApp mientras se escribe. Sin número configurado, ofrece el mail. */
export default function WaContact({ number }: { number: string }) {
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [courts, setCourts] = useState("");

  const n = name.trim();
  const v = venue.trim();
  const c = courts.trim();
  const msg =
    "¡Hola! " +
    (n ? `Soy ${n}. ` : "") +
    `Quiero saber más sobre Córner ${v ? `para ${v}` : "para mi complejo"}.` +
    (c ? ` Tenemos ${c} ${c === "1" ? "cancha" : "canchas"}.` : "");

  return (
    <div className="lp-wa">
      <div style={{ display: "grid", gap: 6 }}>
        <h3 className="lp-h" style={{ fontSize: 30 }}>Te lo mostramos <em className="flag">por WhatsApp.</em></h3>
        <p className="muted">Contanos de tu complejo y te lo mostramos armado con tus canchas.</p>
      </div>
      <div className="lp-wa-fields">
        <label className="field">
          <span>Tu nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Martín" autoComplete="given-name" />
        </label>
        <label className="field">
          <span>Tu complejo</span>
          <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Ej: El Potrero" autoComplete="organization" />
        </label>
        <label className="field">
          <span>Canchas</span>
          <input value={courts} onChange={(e) => setCourts(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Ej: 4" inputMode="numeric" />
        </label>
      </div>
      <div className="lp-wa-preview">
        <span className="lp-label">Tu mensaje se arma mientras escribís</span>
        <div className="bubble me">{msg}</div>
      </div>
      {number ? (
        <a href={waLink(number, msg)} className="btn wa block" target="_blank" rel="noreferrer">Continuar en WhatsApp</a>
      ) : (
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Quiero saber más de Córner")}&body=${encodeURIComponent(msg)}`} className="btn block">Enviar por mail</a>
      )}
      <p className="muted small">
        {number ? "El mensaje se envía desde WhatsApp, cuando lo confirmás. " : ""}
        O escribinos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </div>
  );
}
