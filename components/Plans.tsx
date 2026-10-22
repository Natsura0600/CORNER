"use client";
import Link from "next/link";
import { useState } from "react";
import { ANNUAL_DISCOUNT, COMPARE, PLANS, TRIAL_DAYS, money } from "@/lib/config";
import { Check, Dash } from "./Icons";

export default function Plans() {
  const [annual, setAnnual] = useState(false);
  return (
    <div style={{ display: "grid", gap: 56 }}>
      <div>
        <div className="billing" role="group" aria-label="Forma de pago">
          <button aria-pressed={!annual} onClick={() => setAnnual(false)}>Mensual</button>
          <button aria-pressed={annual} onClick={() => setAnnual(true)}>Anual · {Math.round(ANNUAL_DISCOUNT * 100)}% off</button>
        </div>
        <div className="plans">
          {PLANS.map((p, i) => {
            const price = annual ? p.monthly * (1 - ANNUAL_DISCOUNT) : p.monthly;
            return (
              <article key={p.id} className={`plan ${p.featured ? "featured" : ""}`} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
                {p.featured && <span className="badge">El más elegido</span>}
                <div style={{ display: "grid", gap: 6 }}>
                  <h3>{p.name}</h3>
                  <span className="muted">{p.pitch}</span>
                </div>
                <div className="price">
                  <span key={String(annual)} className="price-num">{money(price)}</span> <small>/ mes{annual ? ", pago anual" : ""}</small>
                </div>
                <span className="plan-courts">{p.courts}</span>
                <ul className="checks">
                  {p.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <Link href="/registro" className="btn block">Empezar {TRIAL_DAYS} días gratis</Link>
              </article>
            );
          })}
        </div>
      </div>

      <div id="comparar" style={{ display: "grid", gap: 18 }} data-reveal>
        <h3 style={{ fontSize: "clamp(26px, 3vw, 34px)" }}>Comparación completa</h3>
        <div className="compare-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">Función</span></th>
                {PLANS.map((p) => (
                  <th key={p.id} scope="col" className={p.featured ? "hl" : ""}>
                    {p.name}
                    <small>{money(annual ? p.monthly * (1 - ANNUAL_DISCOUNT) : p.monthly)}/mes</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {row.values.map((v, i) => (
                    <td key={i} className={PLANS[i].featured ? "hl" : ""}>
                      {v === true ? <span className="yes"><Check /><span className="sr-only">Incluido</span></span> : v === false ? <span className="no"><Dash /><span className="sr-only">No incluido</span></span> : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">La prueba gratis de {TRIAL_DAYS} días incluye todo lo del plan Pro, hasta 8 canchas. Cuando termina no se cobra nada: la página deja de tomar reservas hasta que elijas un plan.</p>
      </div>
    </div>
  );
}
