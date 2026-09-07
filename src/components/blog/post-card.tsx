import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PostMetaRow } from "./post-meta-row";
import type { PostMeta } from "@/lib/blog/types";

/** One post in the index list. */
export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:bg-secondary"
    >
      <PostMetaRow
        date={post.date}
        category={post.category}
        readingMinutes={post.readingMinutes}
      />

      <h2 className="flex items-start gap-2 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary md:text-2xl">
        <span>{post.title}</span>
        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      </h2>

      <p className="text-sm leading-relaxed text-muted-foreground">{post.summary}</p>

      {post.tags.length > 0 && (
        <ul className="mt-1 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
