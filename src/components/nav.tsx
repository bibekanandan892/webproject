"use client";

import Link from "next/link";
import { GithubIcon } from "@/components/social-icons";
import { useEffect, useState } from "react";
import { actionButtonVariants } from "@/components/ui/action-button";
import { cn } from "@/lib/utils";

const SECTION_LINKS = [
  { label: "Now", href: "#now" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
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
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-sans text-base font-semibold tracking-tight text-foreground transition-colors hover:text-muted-foreground"
          aria-label="Home"
        >
          Bibekananda Nayak
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {SECTION_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-base text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/blog"
            className={cn(actionButtonVariants({ tier: "tertiary" }))}
          >
            Blog
          </Link>
          <a
            href="https://github.com/bibekanandan892"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="GitHub"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
