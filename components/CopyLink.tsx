"use client";
import { useEffect, useState } from "react";

export default function CopyLink({ path }: { path: string }) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(window.location.origin + path), [path]);
  return (
    <div className="linkbox">
      <span className="eyebrow">Tu link de reservas</span>
      <code>{url}</code>
      <button
        className="btn sm ghost"
        onClick={() =>
          navigator.clipboard.writeText(url).then(
            () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
            () => {},
          )
        }
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
