import type { Metadata } from "next";
import { ZenNav } from "@/components/zen/zen-nav";
import { ZenHero } from "@/components/zen/zen-hero";
import { ZenHowItHelps } from "@/components/zen/zen-how-it-helps";
import { ZenAgeMeter } from "@/components/zen/zen-age-meter";
import { ZenTimeline } from "@/components/zen/zen-timeline";
import { ZenScreenshots } from "@/components/zen/zen-screenshots";
import { ZenShotsGallery } from "@/components/zen/zen-shots-gallery";
import { ZenModes } from "@/components/zen/zen-modes";
import { ZenDesktop } from "@/components/zen/zen-desktop";
import { ZenSync } from "@/components/zen/zen-sync";
import { ZenFeatures } from "@/components/zen/zen-features";
import { ZenScreenFree } from "@/components/zen/zen-screen-free";
import { ZenPrivacy } from "@/components/zen/zen-privacy";
import { ZenSpecs } from "@/components/zen/zen-specs";
import { ZenDownload } from "@/components/zen/zen-download";
import { ZenFaq } from "@/components/zen/zen-faq";
import { Footer } from "@/components/footer";
import { getZenRelease } from "@/lib/zen-release";

export const metadata: Metadata = {
  title: "Zen — Screen-Time Tracker & Focus Tools for Android & Windows",
  description:
    "Zen shows how your day is really spent, on your phone and your PC. A calm Android home screen plus a Windows companion: a Memento Mori age meter, a per-app timeline tagged Learn/Productive/Fun/Waste, on-device AI, and unbypassable focus tools. Everything stays on your device.",
  keywords: [
    "Zen",
    "Zen Launcher",
    "Zen Desktop",
    "Android Launcher",
    "Screen Time Tracker",
    "Windows Activity Tracker",
    "Memento Mori Clock",
    "Digital Wellbeing",
    "On-device AI",
    "Gemma 3 1B",
    "Qwen2.5",
    "Jetpack Compose",
    "Kotlin",
    ".NET WPF",
  ],
  openGraph: {
    title: "Zen — Screen-Time Tracker & Focus Tools for Android & Windows",
    description:
      "See how your day is really spent, on your phone and your PC — a live age meter, an honest timeline, and real friction against the apps that waste your time.",
    url: "https://bibekananda.in/zen/",
    type: "website",
    siteName: "Bibekananda Nayak",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zen — Screen-Time Tracker for Android & Windows",
    description:
      "A live age meter, an honest per-app timeline, and on-device AI — for your phone and your PC.",
  },
};

export default async function ZenProductPage() {
  const release = await getZenRelease();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      {/* Zen Navigation */}
      <ZenNav />

      {/* Main Product Content */}
      <main className="flex-1">
        <ZenHero release={release} />
        <ZenHowItHelps />
        <ZenAgeMeter />
        <ZenTimeline />
        <ZenScreenshots />
        <ZenShotsGallery />
        <ZenModes />
        <ZenDesktop />
        <ZenSync />
        <ZenFeatures />
        <ZenScreenFree />
        <ZenPrivacy />
        <ZenSpecs />
        <ZenDownload release={release} />
        <ZenFaq />
      </main>

      {/* Standard Site Footer */}
      <Footer />
    </div>
  );
}
