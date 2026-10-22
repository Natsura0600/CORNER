"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Hace aparecer suavemente los elementos con data-reveal cuando entran en pantalla */
export default function Reveal() {
  const path = usePathname();
  useEffect(() => {
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const scan = () => {
      document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          io.observe(el);
        }
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    // Red de seguridad: si algo no se observó, que igual aparezca
    const t = setTimeout(() => document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight) el.classList.add("in");
    }), 1500);
    return () => { io.disconnect(); mo.disconnect(); clearTimeout(t); };
  }, [path]);
  return null;
}
