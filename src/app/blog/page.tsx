import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { ArrowLeft } from "lucide-react";

const upcomingTopics = [
  {
    category: "Android",
    items: [
      "Compose performance: when to use derivedStateOf vs remember",
      "Modularising a multi-million-line Android monorepo",
      "On-device LLM inference with Foundation Models",
    ],
  },
  {
    category: "AI",
    items: [
      "Building an autonomous job-application agent with LangGraph",
      "Prompt caching cost math: when it actually pays off",
      "Playwright as a tool surface for agents",
    ],
  },
];

export const metadata = {
  title: "Blog",
  description: "Writing on Android, AI, and the in-between. Coming soon.",
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <SectionHeading
        index={99}
        label="blog"
        title="Writing soon"
        subtitle="Categories planned: Android and AI."
      />

      <p className="text-base leading-relaxed text-muted-foreground">
        I&apos;m setting up a markdown-driven blog inside this site. Below
        are the first posts I&apos;m drafting. Bookmark this page or follow
        me on GitHub for updates.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        {upcomingTopics.map((t) => (
          <div
            key={t.category}
            className="rounded-xl border border-border bg-card p-6"
          >
            <p className="font-mono text-xs uppercase tracking-wider text-primary">
              {t.category}
            </p>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-foreground">
              {t.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Link
        href="/"
        className="mt-12 inline-flex items-center gap-2 font-mono text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> back home
      </Link>
    </div>
  );
}
