"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's single animated moment (execution.md §1.8): a drifting-particle
 * canvas that fades in behind the hero content. Modeled on the fade-in
 * pattern measured off the anthropic.com hero card — not the WebGL2 scene and
 * video underneath it, which this site has no equivalent asset for, and which
 * `three` (removed in Phase 3) would have been overkill to bring back for.
 *
 * Mount once inside a `position: relative; overflow: hidden` ancestor — the
 * hero's own <section> already is both, so this renders no wrapper of its
 * own. Pair with `useCoverReveal` for the copy entrance; see hero.tsx.
 */
export function Cover() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;

    function resize() {
      const rect = parent!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 42;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.6,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
    }));

    let raf = 0;
    function draw() {
      ctx!.clearRect(0, 0, width, height);
      // Read the theme token each frame (cheap at this particle count) so the
      // dots stay correct if the visitor flips the dark-mode toggle without a
      // reload — light and dark map to different --line-soft values.
      const dot =
        getComputedStyle(parent!).getPropertyValue("--line-soft").trim() ||
        "#D1CFC5";
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = dot;
        ctx!.globalAlpha = 0.6;
        ctx!.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    if (reduceMotion) {
      // One still frame so the canvas isn't blank, then stop — no drifting.
      ctx!.clearRect(0, 0, width, height);
      const dot =
        getComputedStyle(parent).getPropertyValue("--line-soft").trim() ||
        "#D1CFC5";
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = dot;
        ctx!.globalAlpha = 0.6;
        ctx!.fill();
      }
    } else {
      raf = requestAnimationFrame(draw);
    }

    // Fade in on the next frame — mounting directly at opacity 1 would skip
    // the CSS transition entirely, since there'd be no state change to fire.
    const onId = requestAnimationFrame(() => canvas.classList.add("is-on"));

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(onId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="cover-canvas pointer-events-none absolute inset-0 -z-10"
    />
  );
}

/**
 * Stages the hero's entrance: adds `is-copy-shown` to the returned ref's
 * element once it scrolls into view (or immediately, on first paint, since
 * the hero already sits in the viewport on load — matching how the
 * reference's own above-the-fold hero animates in despite never actually
 * being "scrolled" to). The corresponding CSS lives in globals.css, gated
 * inside `prefers-reduced-motion: no-preference` exactly as measured — a
 * reduced-motion visitor gets `is-copy-shown` immediately and never sees
 * hidden copy.
 */
export function useCoverReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-copy-shown");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-copy-shown");
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
