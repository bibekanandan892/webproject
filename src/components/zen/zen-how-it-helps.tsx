"use client";

import { Eye, Hand, Gift, Tags } from "lucide-react";

const PILLARS = [
  {
    icon: Eye,
    tag: "Awareness",
    title: "See exactly where the day goes",
    desc: "A live age meter puts your finite time on the home screen, and a real timeline breaks today into minutes — not a vague \"screen time\" number.",
    href: "#timeline",
    linkLabel: "See the timeline",
  },
  {
    icon: Hand,
    tag: "Friction",
    title: "Make the impulsive opens harder",
    desc: "Wait timers, unbypassable blocks, and a calm home screen in place of the app grid — friction against the apps that don't deserve a free pass.",
    href: "#modes",
    linkLabel: "See launcher vs app mode",
  },
  {
    icon: Gift,
    tag: "Rewards",
    title: "Get greeted for putting it down",
    desc: "An hour or more away from the screen earns a quiet reward on unlock instead of another nag — Zen notices the good as much as the bad.",
    href: "#breaks",
    linkLabel: "See screen-free rewards",
  },
  {
    icon: Tags,
    tag: "Tagging",
    title: "Learn and Productive vs Fun and Waste",
    desc: "Every app, site, and video gets sorted into a category you can act on — tag it yourself, or let on-device AI do it, on your phone and your PC.",
    href: "#features",
    linkLabel: "See tagging & AI",
  },
];

export function ZenHowItHelps() {
  return (
    <section id="how-it-helps" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            01
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            How Zen Helps
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Less screen time. More of the picture.
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          Zen works on two fronts at once: it shows you the truth about how your day
          actually went, and it makes the apps that eat your time a little harder to
          fall into. Both, across your phone and your PC.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <a
              key={p.tag}
              href={p.href}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:border-foreground/30 hover:shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                <Icon className="h-4 w-4" />
              </span>
              <span className="mt-4 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {p.tag}
              </span>
              <h3 className="mt-1 font-sans text-base font-bold text-foreground">
                {p.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {p.desc}
              </p>
              <span className="mt-4 font-sans text-xs font-medium text-foreground underline decoration-dotted underline-offset-4 group-hover:decoration-solid">
                {p.linkLabel}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
