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

function EditorialHero() {
  const onPhotoClick = usePhotoClickEgg();
  return (
    <section id="home" className="relative border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-end gap-12 px-6 py-20 md:grid-cols-12 md:gap-16 md:py-32">
        <div className="md:col-span-7">
          <p className="font-display text-3xl italic text-primary md:text-5xl">
            Hello, I&apos;m
          </p>
          <h1 className="mt-3 font-display text-6xl font-medium leading-[0.95] tracking-tight text-foreground md:text-7xl lg:text-[88px]">
            Bibekananda <em className="font-display italic text-primary">Nayak</em>
          </h1>
          <p className="mt-5 font-display text-xl font-medium text-foreground md:text-2xl">
            Android &amp; Kotlin Multiplatform Developer
          </p>
          <div className="mt-6 h-px w-24 bg-foreground/30" />
          <p className="mt-6 max-w-md font-display text-lg italic leading-relaxed text-muted-foreground">
            Currently shipping consumer apps to tens of millions at Swiggy.
            Previously at iServeU. Building autonomous agents on the side.
          </p>
          <p className="mt-10 font-display text-base italic">
            <Link
              href="#projects"
              className="text-primary underline decoration-primary/40 decoration-1 underline-offset-[6px] transition-colors hover:decoration-primary"
            >
              Read his selected work →
            </Link>
          </p>
        </div>

        <div className="md:col-span-5">
          <figure className="relative">
            <div
              className="relative cursor-pointer overflow-hidden rounded-sm bg-secondary shadow-[0_30px_80px_-20px_rgba(26,22,18,0.25)]"
              onClick={onPhotoClick}
            >
              <Image
                src="/profile.png"
                alt="Portrait of Bibekananda Nayak"
                width={520}
                height={680}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
            <figcaption className="mt-4 font-display text-xs italic text-muted-foreground">
              Portrait, 2026 · photographed for this volume
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

export function EditorialSerifVariant() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <EditorialHero />
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
