import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { PostList } from "@/components/blog/post-list";
import { getAllPosts, getUsedCategories } from "@/lib/blog";

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
  description: "Notes on Android, LLM internals, and the in-between.",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getUsedCategories();

  return (
    <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <SectionHeading
        index={99}
        label="blog"
        title="Writing"
        subtitle="Notes on what I'm learning, in my own words."
      />

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          First posts are on the way.
        </p>
      ) : (
        <PostList posts={posts} categories={categories} />
      )}

      <div className="mt-20 max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-primary">writing next</p>
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          {upcomingTopics.map((t) => (
            <div key={t.category} className="flex flex-col gap-3">
              <p className="font-mono text-xs text-muted-foreground">{t.category}</p>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {t.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/50" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/"
        className="mt-16 inline-flex items-center gap-2 font-mono text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> back home
      </Link>
    </div>
  );
}
