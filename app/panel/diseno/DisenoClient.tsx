"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import VenueHeader, { venueVars } from "@/components/VenueHeader";
import { ACCENTS, FONTS, HEADERS, effectiveTheme, isHex } from "@/lib/theme";
import { FEATURE_PLAN, type Feature } from "@/lib/plans";
import type { FontChoice, HeaderStyle, Theme } from "@/lib/types";

type Loaded = { theme: Theme; features: Feature[]; plan: string; slug: string; name: string; cid: string };

/** Achica la imagen en el navegador antes de subirla */
async function shrink(file: File, maxW: number, maxH: number, limit: number): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width, maxH / bmp.height);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  cv.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  for (const q of [0.85, 0.75, 0.62, 0.5, 0.4]) {
    let url = cv.toDataURL("image/webp", q);
    if (!url.startsWith("data:image/webp")) url = cv.toDataURL("image/jpeg", q);
    if (url.length <= limit) return url;
  }
  throw new Error("La imagen es muy pesada. Probá con una más chica.");
}

export default function DisenoClient() {
  const [d, setD] = useState<Loaded | null>(null);
  const [t, setT] = useState<Theme | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [dirty, setDirty] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/panel/diseno", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: Loaded) => { setD(j); setT(j.theme); })
      .catch(() => setErr("No se pudo cargar el diseño."));
  }, []);

  if (!d || !t) return err ? <p className="err">{err}</p> : <p className="muted">Cargando…</p>;
  const can = (f?: Feature) => !f || d.features.includes(f);
  const set = (p: Partial<Theme>) => { setT({ ...t, ...p }); setDirty(true); };
  const eff = effectiveTheme(t, d.features);
  const logoUrl = t.logoV ? `/api/img/${d.cid}/logo?v=${t.logoV}` : undefined;
  const coverUrl = t.coverV ? `/api/img/${d.cid}/cover?v=${t.coverV}` : undefined;

  async function save() {
    setErr("");
    setBusy(true);
    const r = await fetch("/api/panel/diseno", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "No se pudo guardar.");
    setT(j.theme);
    setDirty(false);
    toast.show("Diseño guardado. Ya se ve en tu página.");
  }

  async function upload(kind: "logo" | "cover", file?: File) {
    if (!file) return;
    setErr("");
    setUploading(kind);
    try {
      const dataUrl = kind === "logo" ? await shrink(file, 320, 320, 200_000) : await shrink(file, 1600, 900, 460_000);
      const r = await fetch("/api/panel/diseno/imagen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, dataUrl }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se pudo subir la imagen.");
      setT((prev) => ({ ...prev!, logoV: j.theme.logoV, coverV: j.theme.coverV, header: kind === "cover" && prev!.header === "liso" ? "portada" : prev!.header }));
      if (kind === "cover") setDirty(true);
      toast.show(kind === "logo" ? "Logo subido" : "Portada subida");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(null);
    }
  }

  async function removeImg(kind: "logo" | "cover") {
    const r = await fetch(`/api/panel/diseno/imagen?kind=${kind}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j.error || "No se pudo quitar.");
    setT((prev) => ({ ...prev!, logoV: j.theme.logoV, coverV: j.theme.coverV, header: j.theme.header }));
  }

  const Lock = ({ f }: { f: Feature }) => (can(f) ? null : <span className="lock">Plan {FEATURE_PLAN[f]}</span>);

  return (
    <div className="design-wrap">
      <div className="design-form">
        <section className="card form">
          <h2 className="h-sm">Color principal</h2>
          <div className="swatches" role="radiogroup" aria-label="Color principal">
            {ACCENTS.map((a) => (
              <button key={a.hex} role="radio" aria-checked={t.accent === a.hex} className="swatch" style={{ background: a.hex }} onClick={() => set({ accent: a.hex })} title={a.name}>
                <span className="sr-only">{a.name}</span>
              </button>
            ))}
            <label className="swatch custom" title="Otro color">
              <input id="d-color" type="color" value={isHex(t.accent) ? t.accent : "#1f7a46"} onChange={(e) => set({ accent: e.target.value })} aria-label="Elegir otro color" />
              <span aria-hidden="true">+</span>
            </label>
          </div>
          <p className="muted small">Se usa en los botones, el día elegido y el encabezado a color.</p>
        </section>

        <section className="card form">
          <h2 className="h-sm">Encabezado</h2>
          <div className="choice-grid">
            {(Object.keys(HEADERS) as HeaderStyle[]).map((h) => {
              const f = HEADERS[h].feature;
              return (
                <button key={h} className="choice" aria-pressed={t.header === h} disabled={!can(f)} onClick={() => set({ header: h })}>
                  <span className={`choice-art art-${h}`} style={{ ["--accent" as string]: t.accent }} aria-hidden="true" />
                  <b>{HEADERS[h].label}</b>
                  {f && <Lock f={f} />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card form">
          <h2 className="h-sm">Logo y portada</h2>
          <div className="grid2">
            <div className="field">
              <span>Logo <Lock f="logo" /></span>
              <div className="upload">
                {logoUrl ? <img src={logoUrl} alt="Tu logo" width={56} height={56} className="vlogo" /> : <span className="upload-ph" aria-hidden="true">Logo</span>}
                <div style={{ display: "grid", gap: 6 }}>
                  <label className={`btn sm ghost ${!can("logo") ? "disabled" : ""}`}>
                    {uploading === "logo" ? "Subiendo…" : logoUrl ? "Cambiar" : "Subir logo"}
                    <input id="d-logo" type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={!can("logo") || !!uploading} onChange={(e) => upload("logo", e.target.files?.[0])} />
                  </label>
                  {logoUrl && <button className="linkbtn" onClick={() => removeImg("logo")}>Quitar</button>}
                </div>
              </div>
              <small>Cuadrado, PNG con fondo transparente si tenés.</small>
            </div>
            <div className="field">
              <span>Foto de portada <Lock f="portada" /></span>
              <div className="upload">
                {coverUrl ? <img src={coverUrl} alt="Tu portada" className="cover-thumb" /> : <span className="upload-ph wide" aria-hidden="true">Portada</span>}
                <div style={{ display: "grid", gap: 6 }}>
                  <label className={`btn sm ghost ${!can("portada") ? "disabled" : ""}`}>
                    {uploading === "cover" ? "Subiendo…" : coverUrl ? "Cambiar" : "Subir foto"}
                    <input id="d-cover" type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={!can("portada") || !!uploading} onChange={(e) => upload("cover", e.target.files?.[0])} />
                  </label>
                  {coverUrl && <button className="linkbtn" onClick={() => removeImg("cover")}>Quitar</button>}
                </div>
              </div>
              <small>Horizontal, idealmente una foto de tus canchas.</small>
            </div>
          </div>
        </section>

        <section className="card form">
          <h2 className="h-sm">Tipografía <Lock f="portada" /></h2>
          <div className="choice-grid">
            {(Object.keys(FONTS) as FontChoice[]).map((f) => (
              <button key={f} className="choice" aria-pressed={t.font === f} disabled={f !== "deportiva" && !can("portada")} onClick={() => set({ font: f })}>
                <span className="font-sample" style={{ fontFamily: FONTS[f].stack, fontStretch: FONTS[f].stretch, fontWeight: FONTS[f].weight }}>Aa</span>
                <b>{FONTS[f].label}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="card form">
          <h2 className="h-sm">Textos</h2>
          <label className="field">
            <span>Descripción</span>
            <textarea id="d-desc" rows={3} maxLength={280} value={t.description} onChange={(e) => set({ description: e.target.value })} placeholder="Ej: 4 canchas de fútbol 5 techadas y 2 de pádel. Estacionamiento y buffet." />
            <small>{t.description.length}/280</small>
          </label>
          <label className="field">
            <span>Instagram</span>
            <input id="d-ig" value={t.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="@tucomplejo" />
          </label>
        </section>

        {err && <p className="err" role="alert">{err}</p>}
        <div className="save-bar">
          <button className="btn" onClick={save} disabled={busy || !dirty}>{busy ? "Guardando…" : dirty ? "Guardar diseño" : "Guardado"}</button>
          <a className="btn ghost" href={`/c/${d.slug}`} target="_blank" rel="noreferrer">Ver mi página ↗</a>
        </div>
      </div>

      <div className="design-preview" aria-label="Vista previa">
        <span className="eyebrow">Vista previa</span>
        <div className="preview-frame venue" style={venueVars(eff)}>
          <VenueHeader preview name={d.name} place="Tu ciudad" theme={eff} logoUrl={logoUrl} coverUrl={coverUrl} whatsapp="5491100000000" />
          <div className="preview-body">
            <div className="tabs">
              <span className="tab" aria-pressed="true">Fútbol</span>
              <span className="tab">Pádel</span>
            </div>
            <div className="days">
              {["Hoy", "Mañana", "Vie"].map((x, i) => (
                <span key={x} className="daybtn" aria-pressed={i === 0}><small>{x}</small><b>{21 + i}</b></span>
              ))}
            </div>
            <div className="slots">
              {["19:00", "20:00", "21:00", "22:00"].map((x, i) => (
                <span key={x} className={`slot ${i === 1 ? "on" : ""}`}><b>{x}</b><span>$75.000</span></span>
              ))}
            </div>
            <span className="btn block">Confirmar reserva</span>
          </div>
        </div>
        {!can("logo") && <p className="muted small">Con el plan {d.plan} podés cambiar el color y los textos. Logo, encabezado a color, portada y tipografía vienen en Club y Pro.</p>}
      </div>
      {toast.node}
    </div>
  );
}
