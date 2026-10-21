import Link from "next/link";

/** Bandera de córner: el mástil y el banderín triangular */
export function Flag({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <rect x="5" y="2" width="2.6" height="22" rx="1.3" fill="currentColor" />
      <path d="M7.6 3 L22 8.2 L7.6 13.4 Z" fill="var(--flag)" />
      <path d="M2 24 Q8 18 14 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
