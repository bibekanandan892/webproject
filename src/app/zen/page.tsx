import type { Metadata } from "next";
import { ZenNav } from "@/components/zen/zen-nav";
import { ZenHero } from "@/components/zen/zen-hero";
import { ZenAgeMeter } from "@/components/zen/zen-age-meter";
import { ZenTimeline } from "@/components/zen/zen-timeline";
import { ZenScreenshots } from "@/components/zen/zen-screenshots";
import { ZenFeatures } from "@/components/zen/zen-features";
import { ZenScreenFree } from "@/components/zen/zen-screen-free";
import { ZenPrivacy } from "@/components/zen/zen-privacy";
import { ZenSpecs } from "@/components/zen/zen-specs";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Zen Launcher — Calm, Black & White Android Home Screen",
  description:
    "A calm, black-and-white Android home screen that shows how your day is really spent — with Memento Mori age tracking, on-device Gemma 3 1B AI, and unbypassable focus tools. Everything stays on the phone.",
  keywords: [
    "Zen Launcher",
    "Android Launcher",
    "Minimalist Phone",
    "Memento Mori Clock",
    "Digital Wellbeing",
    "On-device AI",
    "Gemma 3 1B",
    "Screen Time Tracker",
    "Jetpack Compose",
    "Kotlin",
  ],
  openGraph: {
    title: "Zen Launcher — Calm, Black & White Android Home Screen",
    description:
      "A calm, black-and-white Android home screen that shows how your day is really spent — and helps you spend less of it on the phone.",
    url: "https://bibekananda.in/zen/",
    type: "website",
    siteName: "Bibekananda Nayak",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zen Launcher — Distraction-Free Android Home Screen",
    description:
      "Shows how your day is really spent — Memento Mori age meter, on-device Gemma AI, and unbypassable focus tools.",
  },
};

export default function ZenProductPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      {/* Zen Navigation */}
      <ZenNav />

      {/* Main Product Content */}
      <main className="flex-1">
        <ZenHero />
        <ZenAgeMeter />
        <ZenTimeline />
        <ZenScreenshots />
        <ZenFeatures />
        <ZenScreenFree />
        <ZenPrivacy />
        <ZenSpecs />
      </main>

      {/* Standard Site Footer */}
      <Footer />
    </div>
  );
}
