"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Smartphone } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";

export function ZenNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
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

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-foreground text-background font-mono text-xs font-bold">
              Z
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-base font-semibold tracking-tight text-foreground">
                Zen Launcher
              </span>
              <span className="rounded border border-border bg-secondary/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                v0.1.0
              </span>
            </div>
          </div>
        </div>

        <nav className="hidden items-center gap-5 text-xs font-medium text-muted-foreground md:flex">
          <a href="#overview" className="transition-colors hover:text-foreground">
            Overview
          </a>
          <a href="#age-meter" className="transition-colors hover:text-foreground">
            Age Meter
          </a>
          <a href="#timeline" className="transition-colors hover:text-foreground">
            Timeline
          </a>
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#breaks" className="transition-colors hover:text-foreground">
            Rewards
          </a>
          <a href="#privacy" className="transition-colors hover:text-foreground">
            Privacy
          </a>
          <a href="#specs" className="transition-colors hover:text-foreground">
            Specs
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="https://github.com/bibekanandan892/zen-launcher"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-foreground bg-foreground px-3.5 py-1.5 font-sans text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
