"use client";

import Link from "next/link";
import { GithubIcon } from "@/components/social-icons";
import { useEffect, useState } from "react";

const SECTION_LINKS = [
  { label: "now", href: "#now" },
  { label: "experience", href: "#experience" },
  { label: "projects", href: "#projects" },
  { label: "contact", href: "#contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-tight text-foreground transition-colors hover:text-primary"
          aria-label="Home"
        >
          <span className="text-primary">bn</span>
          <span className="text-primary">.</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {SECTION_LINKS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative rounded-md px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <span className="text-primary/70 mr-1">0{i + 1}.</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/blog"
            className="rounded-md border border-primary/30 px-3 py-1.5 font-mono text-xs text-primary transition-all hover:border-primary hover:bg-primary/10"
          >
            blog
          </Link>
          <a
            href="https://github.com/bibekanandan892"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            aria-label="GitHub"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
