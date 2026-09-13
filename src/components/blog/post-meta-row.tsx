import { formatPostDate } from "@/lib/blog/format";
import type { PostCategory } from "@/lib/blog/types";

interface PostMetaRowProps {
  date: string;
  category: PostCategory;
  readingMinutes: number;
}

/** The `Sep 7, 2026 · AI · 9 min read` line shared by cards and article headers. */
export function PostMetaRow({ date, category, readingMinutes }: PostMetaRowProps) {
  return (
    <p className="flex flex-wrap items-center gap-2 font-mono text-base text-muted-foreground">
      <time dateTime={date}>{formatPostDate(date)}</time>
      <span className="text-border">/</span>
      <span>{category}</span>
      <span className="text-border">/</span>
      <span>{readingMinutes} min read</span>
    </p>
  );
}
