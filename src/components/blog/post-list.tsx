"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { PostCard } from "./post-card";
import type { PostCategory, PostMeta } from "@/lib/blog/types";

const ALL = "all" as const;
type Filter = typeof ALL | PostCategory;

const FILTER_LABEL: Partial<Record<Filter, string>> = { all: "All" };
function filterLabel(option: Filter): string {
  return FILTER_LABEL[option] ?? option;
}

interface PostListProps {
  posts: readonly PostMeta[];
  categories: readonly PostCategory[];
}

/** Everything a search query is matched against, lowercased once per post. */
function haystack(post: PostMeta): string {
  return [post.title, post.summary, post.category, ...post.tags].join(" ").toLowerCase();
}

/** The post index: search box, category filter, and a card grid. */
export function PostList({ posts, categories }: PostListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(ALL);

  // Keeps typing responsive if the list ever grows large.
  const deferredQuery = useDeferredValue(query);

  const indexed = useMemo(
    () => posts.map((post) => ({ post, text: haystack(post) })),
    [posts],
  );

  const visible = useMemo(() => {
    const terms = deferredQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return indexed
      .filter(({ post }) => filter === ALL || post.category === filter)
      .filter(({ text }) => terms.every((term) => text.includes(term)))
      .map(({ post }) => post);
  }, [indexed, deferredQuery, filter]);

  const showFilter = categories.length > 1;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            aria-label="Search posts"
            className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-9 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showFilter && (
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter posts by category"
          >
            {[ALL, ...categories].map((option) => {
              const active = filter === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  aria-pressed={active}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-all ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-border-hover hover:text-foreground"
                  }`}
                >
                  {filterLabel(option)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {visible.length} {visible.length === 1 ? "post" : "posts"} found
      </p>

      {visible.length === 0 ? (
        <div className="rounded-card border border-dashed border-border p-10 text-center">
          <p className="text-base text-muted-foreground">
            No posts match{" "}
            {query ? <span className="text-foreground">“{query}”</span> : "that filter"}
            .
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter(ALL);
            }}
            className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-all hover:border-border-hover"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
