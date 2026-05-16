"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor-tracking spotlight. Absolutely positioned inside its parent;
 * the parent should be `relative overflow-hidden`. Skips on touch
 * devices and when reduced-motion is preferred.
 */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let frame = 0;
    const onMove = (e: MouseEvent) => {
      const parent = el.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.background = `radial-gradient(420px circle at ${x}px ${y}px, rgba(100, 255, 218, 0.10), transparent 70%)`;
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 transition-[background] duration-200"
    />
  );
}
