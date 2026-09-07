"use client";

import { useMemo, useState } from "react";
import { PostCard } from "./post-card";
import type { PostCategory, PostMeta } from "@/lib/blog/types";

const ALL = "all" as const;
type Filter = typeof ALL | PostCategory;

interface PostListProps {
  posts: readonly PostMeta[];
  categories: readonly PostCategory[];
}

/** The post index, with a client-side category filter. */
export function PostList({ posts, categories }: PostListProps) {
  const [filter, setFilter] = useState<Filter>(ALL);

  const visible = useMemo(
    () => (filter === ALL ? posts : posts.filter((post) => post.category === filter)),
    [posts, filter],
  );

  const showFilter = categories.length > 1;

  return (
    <div className="flex flex-col gap-8">
      {showFilter && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter posts by category">
          {[ALL, ...categories].map((option) => {
            const active = filter === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={active}
                className={`rounded-md border px-3 py-1.5 font-mono text-xs transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
