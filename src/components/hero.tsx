"use client";

import Image from "next/image";
import Link from "next/link";
import { Spotlight } from "@/components/spotlight";
import { ArrowDown } from "lucide-react";
import { usePhotoClickEgg } from "@/lib/photo-egg";

export function Hero() {
  const onPhotoClick = usePhotoClickEgg();
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden border-b border-border"
    >
      <Spotlight />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-12 md:gap-12 md:py-24">
        <div className="flex w-full flex-col gap-6 md:col-span-7 md:items-start">
          <p className="font-mono text-sm text-primary">
            <span className="text-primary/60">::</span> 00{" "}
            <span className="text-primary/60">/</span> hi, my name is
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Bibekananda Nayak.
          </h1>
          <h2 className="text-2xl font-semibold tracking-tight text-muted-foreground md:text-4xl lg:text-5xl">
            I build for{" "}
            <span className="text-primary">phones, agents, the web</span>.
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            I&apos;m a software engineer specialising in Android, Kotlin
            Multiplatform, and applied AI. Currently shipping consumer apps at{" "}
            <span className="text-foreground">Swiggy</span> and building
            autonomous agents on the side. Previously{" "}
            <span className="text-foreground">iServeU</span>.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="#projects"
              className="rounded-md border border-primary/40 bg-primary/10 px-5 py-3 font-mono text-sm text-primary transition-all hover:border-primary hover:bg-primary/20"
            >
              view my work
            </Link>
            <Link
              href="#contact"
              className="rounded-md px-5 py-3 font-mono text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              get in touch →
            </Link>
          </div>
        </div>

        <div className="relative w-full md:col-span-5">
          <div className="absolute -inset-3 rounded-2xl bg-primary/20 blur-3xl" />
          <div
            className="relative mx-auto aspect-[4/5] w-full max-w-sm cursor-pointer overflow-hidden rounded-2xl border-2 border-primary/40 md:max-w-none"
            onClick={onPhotoClick}
          >
            <Image
              src="/profile.png"
              alt="Portrait of Bibekananda Nayak"
              fill
              priority
              sizes="(min-width: 768px) 40vw, 80vw"
              className="object-cover grayscale transition-all duration-500 hover:grayscale-0"
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-muted-foreground">
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </div>
    </section>
  );
}
