import Link from "next/link";

/** Isotipo: la esquina de la cancha vista de costado (líneas de cal, arco del córner y banderín) */
export function Flag({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="8 0 88 100" aria-hidden="true">
      <path d="M19.5 62 A28.5 28.5 0 0 1 48 90.5" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      <rect x="14" y="85" width="76" height="11" rx="5.5" fill="currentColor" />
      <rect x="14" y="4" width="11" height="92" rx="5.5" fill="currentColor" />
      <path className="pennant" d="M25 7 L84 28.5 L25 50 Z" fill="var(--flag)" />
    </svg>
  );
}

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Córner, inicio">
      <Flag />
      Córner
    </Link>
  );
}
