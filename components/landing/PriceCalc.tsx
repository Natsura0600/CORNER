"use client";
import Link from "next/link";
import { useState } from "react";
import { ANNUAL_DISCOUNT, COMPARE, PLANS, TRIAL_DAYS, money } from "@/lib/config";
import { Check, Dash } from "../Icons";

const MAX = 6;
const LIMIT = { inicial: 1, club: 2 };

export default function PriceCalc() {
  const [courts, setCourts] = useState(2);
  const [annual, setAnnual] = useState(false);

  const plan = courts <= LIMIT.inicial ? PLANS[0] : courts <= LIMIT.club ? PLANS[1] : PLANS[2];
  const monthly = annual ? plan.monthly * (1 - ANNUAL_DISCOUNT) : plan.monthly;
  const from = Math.min(...PLANS.map((p) => p.monthly));

  return (
    <div style={{ display: "grid", gap: 56 }}>
      <div className="lp-price">
        <div className="lp-price-copy">
          <p className="eyebrow">Precios</p>
          <h2 className="lp-h">Desde <em className="flag">{money(from)}</em> por mes.</h2>
          <p className="lp-lead">Un precio fijo según tus canchas. Sin comisiones por turno. Probás {TRIAL_DAYS} días con todo y, cuando termina, no se cobra nada.</p>

          <div style={{ display: "grid", gap: 10 }}>
            <span className="lp-label" id="lp-courts-label">¿Cuántas canchas tenés?</span>
            <div className="lp-stepper" role="group" aria-labelledby="lp-courts-label">
              <button type="button" aria-label="Una cancha menos" onClick={() => setCourts((n) => Math.max(1, n - 1))} disabled={courts <= 1}>−</button>
              <output aria-live="polite">{courts >= MAX ? `${MAX}+` : courts}</output>
              <button type="button" className="dark" aria-label="Una cancha más" onClick={() => setCourts((n) => Math.min(MAX, n + 1))} disabled={courts >= MAX}>+</button>
            </div>
          </div>

          <div className="billing" role="group" aria-label="Forma de pago" style={{ marginBottom: 0, justifySelf: "start" }}>
            <button aria-pressed={!annual} onClick={() => setAnnual(false)}>Mensual</button>
            <button aria-pressed={annual} onClick={() => setAnnual(true)}>Anual · {Math.round(ANNUAL_DISCOUNT * 100)}% off</button>
          </div>
        </div>

        <article className="lp-plan" aria-live="polite">
          <div className="lp-plan-top">
            <div>
              <h3>Plan {plan.name}</h3>
              <span>{plan.courts}</span>
            </div>
            {plan.featured && <span className="badge">El más elegido</span>}
          </div>
          <div className="lp-plan-price">
            <b key={`${plan.id}-${annual}`} className="price-num">{money(monthly)}</b>
            <span>por mes</span>
          </div>
          {annual && <p className="lp-plan-note">Pagás {money(monthly * 12)} una vez al año.</p>}
          <ul className="checks">
            {plan.features.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <Link href="/registro" className="btn block">Probar {TRIAL_DAYS} días gratis</Link>
          <p className="lp-plan-note" style={{ textAlign: "center" }}>Precio final en pesos. Sin tarjeta para empezar.</p>
        </article>
      </div>

      <details className="lp-compare">
        <summary>Ver la comparación completa de planes</summary>
        <div className="compare-wrap" style={{ marginTop: 18 }}>
          <table className="compare">
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">Función</span></th>
                {PLANS.map((p) => (
                  <th key={p.id} scope="col" className={p.id === plan.id ? "hl" : ""}>
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
                    <td key={i} className={PLANS[i].id === plan.id ? "hl" : ""}>
                      {v === true ? <span className="yes"><Check /><span className="sr-only">Incluido</span></span> : v === false ? <span className="no"><Dash /><span className="sr-only">No incluido</span></span> : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small" style={{ marginTop: 14 }}>La prueba gratis de {TRIAL_DAYS} días incluye todo lo del plan Pro, hasta 8 canchas. Cuando termina no se cobra nada: la página deja de tomar reservas hasta que elijas un plan.</p>
      </details>
    </div>
  );
}
