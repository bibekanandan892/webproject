"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * The only UI control for the dark theme (execution.md Phase 6). Lives in
 * the blog header, but the choice it writes is read by the bootstrap script
 * in layout.tsx on every page — so the homepage, which has no button of its
 * own, still opens dark for a visitor who chose dark here.
 *
 * Written as "light" rather than clearing the key when the visitor flips
 * back: that lets a deliberate light choice stick instead of silently
 * reverting once the OS's own colour scheme is consulted somewhere else.
 * The bootstrap script's read is still a plain `=== "dark"` check, so any
 * other stored value — "light", garbage, or nothing — falls through to the
 * light default.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    const root = document.documentElement;
    if (next) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private browsing / storage disabled — the toggle still works for
      // this page view, it just won't be remembered on the next visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
    >
      {/* A fixed 16px box either way, mounted or not, so nothing shifts
          layout once the real icon swaps in. Rendering nothing before mount
          (rather than guessing) avoids a hydration mismatch: the server has
          no way to know the visitor's saved theme. */}
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}
