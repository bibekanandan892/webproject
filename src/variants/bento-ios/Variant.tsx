"use client";

import Image from "next/image";
import Link from "next/link";
import { Now } from "@/components/now";
import { Experience } from "@/components/experience";
import { Tech } from "@/components/tech";
import { Projects } from "@/components/projects";
import { Contact } from "@/components/contact";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { usePhotoClickEgg } from "@/lib/photo-egg";

function BentoHero() {
  const onPhotoClick = usePhotoClickEgg();
  return (
    <section id="home" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5 lg:gap-6">
        <div
          className="group relative col-span-1 flex min-h-[460px] flex-col justify-end overflow-hidden rounded-3xl border border-border p-8 transition-all duration-300 hover:-translate-y-1 md:col-span-2 md:min-h-[520px] md:p-12"
          style={{
            background:
              "linear-gradient(135deg, #1E2330 0%, #161A22 60%, #0F141C 100%)",
          }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 opacity-60 blur-3xl" />
          <div className="relative">
            <p className="text-3xl font-light text-primary md:text-5xl">
              Hello, I&apos;m
            </p>
            <h1 className="mt-2 text-5xl font-bold tracking-tight text-foreground md:text-7xl">
              Bibekananda <span className="text-primary">Nayak</span>
            </h1>
            <p className="mt-4 text-lg font-semibold text-foreground md:text-xl">
              Android &amp; Kotlin Multiplatform Developer
            </p>
            <p className="mt-5 max-w-md italic text-muted-foreground">
              Currently shipping consumer apps to tens of millions at Swiggy.
              Previously at iServeU. Building autonomous agents on the side.
            </p>
            <Link
              href="#projects"
              className="mt-7 inline-block rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              See projects
            </Link>
          </div>
        </div>

        <div
          className="group relative min-h-[460px] cursor-pointer overflow-hidden rounded-3xl border border-border md:min-h-[520px]"
          style={{ background: "linear-gradient(160deg, #2A1E10 0%, #1E2330 100%)" }}
          onClick={onPhotoClick}
        >
          <Image
            src="/profile.png"
            alt="Portrait of Bibekananda Nayak"
            fill
            priority
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">
              ↳ india · remote-friendly
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BentoIosVariant() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <BentoHero />
        <Now />
        <Experience />
        <Tech />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
