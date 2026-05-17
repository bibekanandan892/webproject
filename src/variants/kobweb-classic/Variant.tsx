"use client";

import Image from "next/image";
import Link from "next/link";
import { nowEntries, STATUS_LABELS } from "@/data/now";
import { experiences } from "@/data/experience";
import { techStack } from "@/data/tech";
import { lookingFor } from "@/data/looking-for";
import { projects } from "@/data/projects";
import { usePhotoClickEgg } from "@/lib/photo-egg";

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-10 text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
        {kicker}
      </div>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        {title}
      </h2>
      <div className="mx-auto mt-4 h-[3px] w-12 rounded-full bg-[var(--primary)]" />
    </div>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.27-.01-1-.02-1.95-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.7 1.25 3.36.95.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.19 1.18.93-.26 1.92-.39 2.91-.39s1.98.13 2.91.39c2.22-1.49 3.19-1.18 3.19-1.18.63 1.59.23 2.77.11 3.06.75.81 1.2 1.84 1.2 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.04.78 2.1 0 1.52-.01 2.74-.01 3.11 0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67h-3.56V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .78 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .78 23.2 0 22.22 0z"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  );
}

function SocialRail() {
  const items = [
    { href: "https://github.com/bibekanandan892", icon: <GithubIcon />, label: "GitHub" },
    { href: "https://www.linkedin.com/in/bibekanandan892/", icon: <LinkedinIcon />, label: "LinkedIn" },
    { href: "mailto:bibekanandan892@gmail.com", icon: <MailIcon />, label: "Email" },
  ];
  return (
    <div className="flex shrink-0 flex-row gap-4 md:flex-col md:gap-5">
      {items.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          target="_blank"
          aria-label={s.label}
          className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
        >
          {s.icon}
        </Link>
      ))}
      <div className="hidden h-16 w-px self-center bg-[var(--border)] md:block" />
    </div>
  );
}

function ClassicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[var(--background)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="#home" className="font-bold tracking-tight text-[var(--foreground)]">
          Bibekananda<span className="text-[var(--primary)]">.</span>
        </Link>
        <nav className="hidden gap-7 text-sm font-medium text-[var(--muted-foreground)] sm:flex">
          {[
            ["Home", "#home"],
            ["About", "#about"],
            ["Experience", "#experience"],
            ["Projects", "#projects"],
            ["Tech", "#tech"],
            ["Contact", "#contact"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-[var(--primary)]">
              {label}
            </a>
          ))}
        </nav>
        <Link
          href="/blog/"
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--primary-foreground)] hover:opacity-90"
        >
          Blog
        </Link>
      </div>
    </header>
  );
}

export function KobwebClassicVariant() {
  const onPhotoClick = usePhotoClickEgg();
  return (
    <>
      <ClassicHeader />
      <main>
        <section
          id="home"
          className="relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(60% 80% at 100% 100%, rgba(0,167,142,0.06), transparent 60%), radial-gradient(60% 80% at 0% 0%, rgba(18,29,52,0.04), transparent 60%)",
          }}
        >
          <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-12 md:gap-10 md:py-20">
            <div className="md:col-span-7 fade-up">
              <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                <SocialRail />
                <div className="min-w-0">
                  <p className="text-3xl font-light text-[var(--primary)] md:text-[45px] md:leading-[1.1]">
                    Hello, I&apos;m
                  </p>
                  <h1 className="mt-4 text-5xl font-black tracking-tight text-[var(--foreground)] md:text-[68px] md:leading-[1.05]">
                    Bibekananda Nayak
                  </h1>
                  <p className="mt-3 text-xl font-bold text-[var(--foreground)]">
                    Kotlin &amp; Android Developer
                  </p>
                  <p className="mt-5 max-w-md text-[15px] italic leading-relaxed text-[var(--muted-foreground)]">
                    Designed and developed multiple Android applications using Kotlin.
                    Currently shipping consumer apps to tens of millions at Swiggy.
                    Previously at iServeU. Building autonomous agents on the side.
                  </p>
                  <Link
                    href="#projects"
                    className="mt-7 inline-block rounded-md bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-[var(--primary-foreground)] transition hover:opacity-90"
                  >
                    See Projects
                  </Link>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 fade-up" style={{ animationDelay: "150ms" }}>
              <div
                className="relative mx-auto aspect-[4/5] w-full max-w-md cursor-pointer md:max-w-none"
                onClick={onPhotoClick}
              >
                <Image
                  src="/profile.png"
                  alt="Bibekananda Nayak"
                  fill
                  priority
                  className="object-cover object-bottom drop-shadow-[0_30px_60px_rgba(18,29,52,0.18)]"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading kicker="Now" title="What I'm building" />
          <div className="grid gap-6 md:grid-cols-3">
            {nowEntries.map((n) => (
              <article
                key={n.title}
                className="rounded-lg border border-border bg-[var(--card)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">
                  <span className="size-1.5 rounded-full bg-[var(--primary)]" />
                  {STATUS_LABELS[n.status]}
                </div>
                <h3 className="text-lg font-bold">{n.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{n.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {n.techStack.map((t) => (
                    <span key={t} className="rounded border border-border bg-[var(--secondary)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="bg-[var(--secondary)]/40 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading kicker="Experience" title="Where I've been" />
            <div className="grid gap-6 md:grid-cols-2">
              {experiences.map((e) => (
                <article key={e.company} className="rounded-lg border border-border bg-[var(--card)] p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-white">
                      <Image src={e.logo} alt={e.company} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{e.company}</h3>
                      <div className="text-sm font-medium text-[var(--primary)]">{e.role}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{e.from} → {e.to}</div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-[var(--muted-foreground)]">{e.description}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {e.highlights.map((h) => (
                      <li key={h} className="flex gap-2">
                        <span className="text-[var(--primary)]">▸</span>{h}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading kicker="Projects" title="Things I've shipped" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.title}
                href={p.links.github ?? p.links.demo ?? "#"}
                target="_blank"
                className={`group overflow-hidden rounded-lg border border-border bg-[var(--card)] shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${p.featured ? "md:col-span-2 lg:col-span-2" : ""}`}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={p.cover} alt={p.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  {p.featured && (
                    <div className="absolute right-3 top-3 rounded bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--primary-foreground)]">
                      Featured
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold">{p.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">{p.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded border border-border bg-[var(--secondary)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="tech" className="bg-[var(--secondary)]/40 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading kicker="Tech" title="Tools I reach for" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {techStack.map((c) => (
                <article key={c.category} className="rounded-lg border border-border bg-[var(--card)] p-5 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--primary)]">{c.category}</div>
                  <p className="mt-1 text-xs italic text-[var(--muted-foreground)]">{c.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.items.map((i) => (
                      <span key={i.name} className="rounded-md border border-border bg-[var(--secondary)] px-2 py-1 text-xs text-[var(--foreground)]">
                        {i.name}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="border-t border-border bg-[var(--foreground)] py-24 text-white">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Contact</div>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Let&apos;s build something together.
            </h2>
            <p className="mx-auto mt-4 max-w-xl italic text-white/70">
              Best on email. Always happy to talk Android, KMP, agents, or anything weird at the intersection.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {lookingFor.contacts.map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  className="rounded-md bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-[var(--primary-foreground)] transition hover:opacity-90"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-16 text-center text-xs text-white/40">
            © {new Date().getFullYear()} · Bibekananda Nayak · Classic cut
          </div>
        </section>
      </main>
    </>
  );
}
