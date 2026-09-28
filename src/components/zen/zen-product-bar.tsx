"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "#see", label: "See" },
  { href: "#focus", label: "Focus" },
  { href: "#look-up", label: "Look up" },
  { href: "#desktop", label: "Windows" },
  { href: "#privacy", label: "Privacy" },
];

/** Sticky product bar: mark, anchors, Download button. Anchors collapse into
 *  a menu on phone, where a separate sticky bottom bar (ZenStickyDownload)
 *  carries the Download CTA instead. */
export function ZenProductBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-xl"
          : "border-b border-transparent bg-background/60 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 font-sans text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            aria-label="Back to Portfolio"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Portfolio</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-foreground font-mono text-xs font-bold text-background">
            Z
          </span>
          <span className="font-sans text-base font-semibold tracking-tight text-foreground">
            Zen
          </span>
        </div>

        <nav className="hidden items-center gap-5 text-xs font-medium text-muted-foreground md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#download"
            className="hidden items-center gap-1.5 rounded-lg border border-foreground bg-foreground px-3.5 py-1.5 font-sans text-xs font-medium text-background transition-opacity hover:opacity-90 sm:inline-flex"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="zen-mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="zen-mobile-menu"
          className="border-t border-border bg-background px-6 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-2 py-2.5 font-sans text-sm text-foreground hover:bg-secondary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
