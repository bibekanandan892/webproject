"use client";

import Image from "next/image";
import Link from "next/link";
import { GlassCard } from "./glass-card";
import { GlassBg } from "./glass-bg";
import { nowEntries, STATUS_LABELS } from "@/data/now";
import { experiences } from "@/data/experience";
import { techStack } from "@/data/tech";
import { lookingFor } from "@/data/looking-for";
import { projects } from "@/data/projects";
import { usePhotoClickEgg } from "@/lib/photo-egg";

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-8 text-center">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
        <span className="size-1.5 rounded-full bg-[var(--accent)]" />
        {kicker}
      </div>
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

function GlassNav() {
  return (
    <nav className="fixed top-4 left-1/2 z-50 -translate-x-1/2">
      <div className="glass glass-shine flex items-center gap-1 px-2 py-1.5 text-sm">
        <Link
          href="#top"
          className="rounded-full px-3 py-1.5 font-semibold tracking-tight text-[var(--foreground)] hover:bg-white/10"
        >
          bn<span className="text-[var(--accent)]">.</span>
        </Link>
        <div className="mx-1 h-5 w-px bg-white/10" />
        {[
          ["now", "#now"],
          ["work", "#projects"],
          ["xp", "#experience"],
          ["stack", "#tech"],
          ["contact", "#contact"],
          ["blog", "/blog/"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-full px-3 py-1.5 text-[var(--muted-foreground)] hover:bg-white/10 hover:text-[var(--foreground)] transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function GlassFooter() {
  return (
    <footer className="relative z-10 mx-auto mt-32 mb-8 max-w-6xl px-6">
      <div className="glass glass-shine flex flex-col items-center gap-2 px-6 py-5 text-center text-sm text-[var(--muted-foreground)] sm:flex-row sm:justify-between sm:text-left">
        <span>© {new Date().getFullYear()} Bibekananda Nayak</span>
        <span className="text-shimmer font-medium">Built with Next.js · Liquid Glass</span>
      </div>
    </footer>
  );
}

export function LiquidGlassVariant() {
  const onPhotoClick = usePhotoClickEgg();
  return (
    <>
      <GlassBg />
      <GlassNav />
      <main id="top" className="relative z-0">
        <div className="mx-auto max-w-6xl px-4 pt-32 pb-24 sm:px-6">
          <section className="min-h-[80vh] grid items-end gap-10 sm:grid-cols-12 sm:gap-12">
            <div className="sm:col-span-7">
              <p className="text-2xl font-light text-[var(--primary)] sm:text-4xl">
                Hello, I&apos;m
              </p>
              <h1 className="mt-3 text-5xl font-bold tracking-tight text-[var(--foreground)] sm:text-7xl">
                <span className="text-shimmer">Bibekananda Nayak</span>
              </h1>
              <p className="mt-4 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                Android &amp; Kotlin Multiplatform Developer
              </p>
              <p className="mt-5 max-w-md italic text-[var(--muted-foreground)] sm:text-base">
                Currently shipping consumer apps to tens of millions at Swiggy.
                Previously at iServeU. Building autonomous agents on the side.
              </p>
              <div className="mt-8">
                <Link
                  href="#projects"
                  className="inline-block rounded-md bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 transition"
                >
                  See projects
                </Link>
              </div>
            </div>
            <div className="sm:col-span-5">
              <div
                className="relative mx-auto aspect-[4/5] w-full max-w-md cursor-pointer overflow-hidden rounded-2xl"
                onClick={onPhotoClick}
              >
                <Image
                  src="/profile.png"
                  alt="Bibekananda Nayak"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </div>
          </section>

          <section id="now" className="mt-28 scroll-mt-24">
            <SectionHeading kicker="now" title="What I'm building right now" />
            <div className="grid gap-5 sm:grid-cols-3">
              {nowEntries.map((n) => (
                <GlassCard key={n.title} className="p-6">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-widest">
                    <span className="size-1.5 rounded-full bg-[var(--accent)] float-y" />
                    {STATUS_LABELS[n.status]}
                  </div>
                  <h3 className="text-xl font-semibold">{n.title}</h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">{n.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {n.techStack.map((t) => (
                      <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-[var(--muted-foreground)]">
                        {t}
                      </span>
                    ))}
                  </div>
                  {n.link && (
                    <Link href={n.link} target="_blank" className="mt-4 inline-flex text-sm text-[var(--accent)] hover:underline">
                      Open →
                    </Link>
                  )}
                </GlassCard>
              ))}
            </div>
          </section>

          <section id="experience" className="mt-28 scroll-mt-24">
            <SectionHeading kicker="experience" title="Where I've been shipping" />
            <div className="grid gap-5 sm:grid-cols-2">
              {experiences.map((e) => (
                <GlassCard key={e.company} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5">
                      <Image src={e.logo} alt={e.company} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{e.company}</h3>
                      <div className="text-sm text-[var(--accent)]">{e.role}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {e.from} → {e.to}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-[var(--muted-foreground)]">{e.description}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {e.highlights.map((h) => (
                      <li key={h} className="flex gap-2">
                        <span className="text-[var(--primary)]">↗</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              ))}
            </div>
          </section>

          <section id="tech" className="mt-28 scroll-mt-24">
            <SectionHeading kicker="stack" title="Tools I reach for" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {techStack.map((c) => (
                <GlassCard key={c.category} className="p-6">
                  <div className="mb-1 text-xs uppercase tracking-widest text-[var(--accent)]">{c.category}</div>
                  <p className="text-xs text-[var(--muted-foreground)] mb-4">{c.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.items.map((i) => (
                      <span key={i.name} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
                        {i.name}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>

          <section id="projects" className="mt-28 scroll-mt-24">
            <SectionHeading kicker="projects" title="Things I've built" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <GlassCard
                  key={p.title}
                  className={`overflow-hidden p-0 ${p.featured ? "sm:col-span-2 lg:col-span-2" : ""}`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={p.cover} alt={p.title} fill className="object-cover transition-transform duration-700 group-hover/card:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    {p.featured && (
                      <div className="absolute right-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent-foreground)]">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{p.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-[var(--muted-foreground)]">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-3 text-sm">
                      {p.links.github && (
                        <Link href={p.links.github} target="_blank" className="text-[var(--primary)] hover:underline">
                          GitHub →
                        </Link>
                      )}
                      {p.links.demo && (
                        <Link href={p.links.demo} target="_blank" className="text-[var(--accent)] hover:underline">
                          Demo →
                        </Link>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>

          <section id="contact" className="mt-28 scroll-mt-24">
            <GlassCard className="p-10 sm:p-14 text-center">
              <h2 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
                Let&apos;s <span className="text-shimmer">build</span> something.
              </h2>
              <p className="mt-4 mx-auto max-w-xl text-[var(--muted-foreground)]">
                Best reached on email. Always happy to talk Android, KMP, agents, or anything weird at the intersection.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {lookingFor.contacts.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    target="_blank"
                    className="rounded-full glass glass-shine glass-hover px-5 py-2.5 text-sm font-medium hover:text-[var(--accent)]"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </GlassCard>
          </section>
        </div>
        <GlassFooter />
      </main>
    </>
  );
}
