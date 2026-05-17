"use client";

import Image from "next/image";
import Link from "next/link";
import { SceneBackground } from "./scene";
import { nowEntries, STATUS_LABELS } from "@/data/now";
import { experiences } from "@/data/experience";
import { techStack } from "@/data/tech";
import { lookingFor } from "@/data/looking-for";
import { projects } from "@/data/projects";
import { usePhotoClickEgg } from "@/lib/photo-egg";

function Kicker({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full r3f-panel px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--primary)]">
      <span className="size-1.5 rounded-full bg-[var(--primary)]" />
      {text}
    </div>
  );
}

export function SpatialThreeDVariant() {
  const onPhotoClick = usePhotoClickEgg();
  return (
    <div className="relative">
      <SceneBackground />

      <nav className="fixed left-1/2 top-5 z-50 -translate-x-1/2">
        <div className="r3f-panel flex items-center gap-1 px-2 py-1.5 text-xs">
          {[
            ["home", "#top"],
            ["now", "#now"],
            ["work", "#projects"],
            ["xp", "#experience"],
            ["stack", "#tech"],
            ["contact", "#contact"],
            ["blog", "/blog/"],
          ].map(([l, h]) => (
            <a
              key={h}
              href={h}
              className="rounded-full px-3 py-1.5 text-[var(--muted-foreground)] hover:bg-white/10 hover:text-[var(--foreground)] transition"
            >
              {l}
            </a>
          ))}
        </div>
      </nav>

      <main id="top" className="mx-auto max-w-5xl space-y-32 px-6 pt-24 pb-24">
        <section className="grid items-center gap-10 sm:grid-cols-12 sm:gap-12 r3f-fade-in">
          <div className="sm:col-span-7">
            <p className="text-2xl font-light text-[var(--primary)] sm:text-4xl">
              Hello, I&apos;m
            </p>
            <h1 className="mt-2 text-5xl font-bold tracking-tight sm:text-7xl">
              <span className="bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[#FFD479] bg-clip-text text-transparent">
                Bibekananda Nayak
              </span>
            </h1>
            <p className="mt-4 text-lg font-semibold text-[var(--foreground)] sm:text-xl">
              Android &amp; Kotlin Multiplatform Developer
            </p>
            <p className="mt-5 max-w-md italic text-[var(--muted-foreground)]">
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
              className="relative mx-auto aspect-[4/5] w-full max-w-md cursor-pointer overflow-hidden rounded-2xl r3f-panel p-1"
              onClick={onPhotoClick}
            >
              <div className="relative h-full w-full overflow-hidden rounded-[calc(var(--radius)-0.25rem)]">
                <Image src="/profile.png" alt="Bibekananda Nayak" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        <section id="now" className="scroll-mt-24 r3f-fade-in">
          <Kicker text="now" />
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">In flight.</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {nowEntries.map((n) => (
              <div key={n.title} className="r3f-panel p-5">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                  <span className="size-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                  {STATUS_LABELS[n.status]}
                </div>
                <h3 className="text-lg font-semibold">{n.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{n.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="experience" className="scroll-mt-24 r3f-fade-in">
          <Kicker text="experience" />
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Where I&apos;ve been.</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {experiences.map((e) => (
              <div key={e.company} className="r3f-panel p-6">
                <div className="flex items-center gap-3">
                  <div className="relative size-12 overflow-hidden rounded-lg border border-white/15">
                    <Image src={e.logo} alt={e.company} fill className="object-cover" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{e.company}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">{e.role}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">{e.from} → {e.to}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">{e.description}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {e.highlights.map((h) => (
                    <li key={h} className="flex gap-2"><span className="text-[var(--accent)]">→</span>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="tech" className="scroll-mt-24 r3f-fade-in">
          <Kicker text="stack" />
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Tools of the trade.</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {techStack.map((c) => (
              <div key={c.category} className="r3f-panel p-5">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)]">{c.category}</div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{c.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.items.map((i) => (
                    <span key={i.name} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px]">{i.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" className="scroll-mt-24 r3f-fade-in">
          <Kicker text="projects" />
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Things that shipped.</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.title}
                href={p.links.github ?? p.links.demo ?? "#"}
                target="_blank"
                className={`group r3f-panel overflow-hidden transition-transform hover:-translate-y-1 ${p.featured ? "sm:col-span-2" : ""}`}
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-t-[inherit]">
                  <Image src={p.cover} alt={p.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {p.featured && (
                    <div className="absolute right-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--accent-foreground)]">Featured</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">{p.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">{t}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 r3f-fade-in">
          <div className="r3f-panel p-10 sm:p-14 text-center">
            <Kicker text="reach" />
            <h2 className="mt-4 text-[clamp(2.5rem,8vw,6rem)] font-black leading-[0.9] tracking-tighter">
              Let&apos;s
              <br />
              <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--primary)] bg-clip-text text-transparent">
                build.
              </span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {lookingFor.contacts.map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold transition hover:scale-[1.04] hover:bg-white/10"
                >
                  {c.label} ↗
                </Link>
              ))}
            </div>
          </div>
        </section>

        <footer className="text-center text-xs text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} · Bibekananda Nayak · Spatial cut
        </footer>
      </main>
    </div>
  );
}
