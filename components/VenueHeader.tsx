import { ChatIcon } from "./Icons";
import { FONTS, onColor } from "@/lib/theme";
import { waLink } from "@/lib/config";
import type { Theme } from "@/lib/types";

type Eff = Theme & { showLogo: boolean; showCover: boolean };

/** Variables CSS del diseño elegido por el complejo */
export function venueVars(t: Eff): React.CSSProperties {
  const f = FONTS[t.font];
  return {
    ["--accent" as string]: t.accent,
    ["--on-accent" as string]: onColor(t.accent),
    ["--vfont" as string]: f.stack,
    ["--vstretch" as string]: f.stretch,
    ["--vweight" as string]: String(f.weight),
  };
}

export default function VenueHeader({
  name,
  place,
  theme,
  logoUrl,
  coverUrl,
  whatsapp,
  preview = false,
}: {
  name: string;
  place: string;
  theme: Eff;
  logoUrl?: string;
  coverUrl?: string;
  whatsapp: string;
  preview?: boolean;
}) {
  const style = theme.header;
  const bg: React.CSSProperties =
    style === "portada" && coverUrl
      ? { backgroundImage: `linear-gradient(180deg, rgb(0 0 0 / .15), rgb(0 0 0 / .65)), url("${coverUrl}")` }
      : {};
  return (
    <header className={`vhead vhead-${style === "portada" && !coverUrl ? "color" : style}`} style={bg}>
      <div className={preview ? "vhead-in" : "container vhead-in"}>
        <div className="vhead-id">
          {theme.showLogo && logoUrl && <img className="vlogo" src={logoUrl} alt={`Logo de ${name}`} width={64} height={64} />}
          <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
            {place && <p className="eyebrow vhead-eyebrow">{place}</p>}
            <h1 className="vname">{name}</h1>
          </div>
        </div>
        {theme.description && <p className="vdesc">{theme.description}</p>}
        <div className="vactions">
          <a className="btn sm vbtn" href={waLink(whatsapp, `Hola! Tengo una consulta sobre ${name}.`)} target="_blank" rel="noreferrer">
            <ChatIcon size={16} />
            WhatsApp
          </a>
          {theme.instagram && (
            <a className="btn sm ghost vbtn-ghost" href={`https://instagram.com/${theme.instagram}`} target="_blank" rel="noreferrer">
              @{theme.instagram}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
