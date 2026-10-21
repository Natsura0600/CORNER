"use client";
import Link from "next/link";
import { useState } from "react";
import { ANNUAL_DISCOUNT, PLANS, TRIAL_DAYS, money } from "@/lib/config";

export default function Plans() {
  const [annual, setAnnual] = useState(false);
  return (
    <div>
      <div className="billing" role="group" aria-label="Forma de pago">
        <button aria-pressed={!annual} onClick={() => setAnnual(false)}>Mensual</button>
        <button aria-pressed={annual} onClick={() => setAnnual(true)}>Anual · {Math.round(ANNUAL_DISCOUNT * 100)}% off</button>
      </div>
      <div className="plans">
        {PLANS.map((p) => {
          const price = annual ? p.monthly * (1 - ANNUAL_DISCOUNT) : p.monthly;
          return (
            <article key={p.id} className={`plan ${p.featured ? "featured" : ""}`}>
              {p.featured && <span className="badge">El más elegido</span>}
              <div style={{ display: "grid", gap: 6 }}>
                <h3>{p.name}</h3>
                <span className="muted">{p.courts}</span>
              </div>
              <div className="price">
                {money(price)} <small>/ mes{annual ? ", pago anual" : ""}</small>
              </div>
              <ul className="checks">
                {p.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <Link href="/registro" className="btn block">Empezar {TRIAL_DAYS} días gratis</Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
