import Link from "next/link";
import { PostMetaRow } from "./post-meta-row";
import { PostThumbnail } from "./post-thumbnail";
import type { PostMeta } from "@/lib/blog/types";

/**
 * One post in the index grid: thumbnail, meta line, title, summary.
 *
 * The trailing slash on `href` is required, not cosmetic. This site is a static
 * export with `trailingSlash: true`; without it, client-side navigation into a
 * dynamic route fails with "Connection closed." and the reader sees "This page
 * couldn't load" until they reload. Direct loads are unaffected, so it only
 * shows up when following a link. Keep the slash on every internal link.
 */
export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}/`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="aspect-[16/9] w-full shrink-0 overflow-hidden border-b border-border">
        <PostThumbnail post={post} />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <PostMetaRow
          date={post.date}
          category={post.category}
          readingMinutes={post.readingMinutes}
        />

        <h2 className="text-lg font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h2>

        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {post.summary}
        </p>

        {post.tags.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-2 pt-2">
            {post.tags.slice(0, 3).map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
