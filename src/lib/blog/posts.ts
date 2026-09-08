import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderMarkdown } from "./markdown";
import { POST_CATEGORIES } from "./types";
import type { Post, PostCategory, PostFrontmatter, PostMeta } from "./types";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");
const WORDS_PER_MINUTE = 220;
/**
 * `YYYY-MM-DD`, optionally followed by `THH:mm` (and seconds).
 *
 * The time is optional and never displayed. It exists so posts published on
 * the same day still order correctly — without one, same-day posts tie and the
 * grid falls back to whatever order the filesystem hands back, which is
 * alphabetical by filename rather than newest-first.
 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/;

/**
 * Drafts are visible while writing locally and dropped from the deployed
 * build, so a work-in-progress post can be pushed safely.
 */
const includeDrafts = process.env.NODE_ENV !== "production";

function fail(slug: string, problem: string): never {
  throw new Error(`content/blog/${slug}.md — ${problem}`);
}

/** Validates authored frontmatter at the boundary so a bad post fails the build loudly. */
function parseFrontmatter(slug: string, data: Record<string, unknown>): PostFrontmatter {
  const { title, date, category, summary, tags, draft, cover } = data;

  if (typeof title !== "string" || !title.trim()) fail(slug, "`title` is required");
  if (typeof summary !== "string" || !summary.trim()) fail(slug, "`summary` is required");
  if (typeof date !== "string" || !DATE_PATTERN.test(date)) {
    fail(slug, "`date` must be YYYY-MM-DD, optionally with THH:mm");
  }
  if (typeof category !== "string" || !POST_CATEGORIES.includes(category as PostCategory)) {
    fail(slug, `\`category\` must be one of ${POST_CATEGORIES.join(", ")}`);
  }
  if (tags !== undefined && !Array.isArray(tags)) fail(slug, "`tags` must be a list");
  if (cover !== undefined && (typeof cover !== "string" || !cover.startsWith("/"))) {
    fail(slug, "`cover` must be a path under public/, starting with `/`");
  }

  return {
    title: title.trim(),
    date,
    category: category as PostCategory,
    summary: summary.trim(),
    tags: Array.isArray(tags) ? tags.map(String) : [],
    draft: draft === true,
    ...(cover ? { cover } : {}),
  };
}

/**
 * Estimates reading time from prose only.
 *
 * Posts embed diagrams as inline SVG, and counting that markup as words
 * inflated every estimate badly — a 1,000-word post was reporting eight
 * minutes. Strip embedded styles and tags before counting.
 */
function readingMinutes(body: string): number {
  const prose = body
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ");
  const words = prose.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function readPostFile(slug: string): { meta: PostMeta; body: string } {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  const frontmatter = parseFrontmatter(slug, data as Record<string, unknown>);
  return {
    meta: { ...frontmatter, slug, readingMinutes: readingMinutes(content) },
    body: content,
  };
}

function listSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.replace(/\.md$/, ""));
}

/**
 * Sort key for a post date.
 *
 * Both accepted shapes are lexicographically ordered already, so a plain
 * string comparison is enough — but a date-only post must not outrank a timed
 * post on the same day, so pad it to midnight first.
 */
function dateKey(date: string): string {
  return date.includes("T") ? date : `${date}T00:00`;
}

/** Every published post, newest first. */
export function getAllPosts(): PostMeta[] {
  return listSlugs()
    .map((slug) => readPostFile(slug).meta)
    .filter((post) => includeDrafts || !post.draft)
    .sort(
      (a, b) =>
        dateKey(b.date).localeCompare(dateKey(a.date)) ||
        // Never let the order depend on the filesystem: two posts stamped with
        // the identical time still need a deterministic, build-stable order.
        a.slug.localeCompare(b.slug),
    );
}

/** Slugs that should be pre-rendered at build time. */
export function getPublishedSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

/** One post, body rendered to HTML. */
export async function getPostBySlug(slug: string): Promise<Post> {
  const { meta, body } = readPostFile(slug);
  const { html, headings } = await renderMarkdown(body);
  return { ...meta, html, headings };
}

/** Neighbouring posts for the prev/next footer, in reading order. */
export function getAdjacentPosts(slug: string): { prev: PostMeta | null; next: PostMeta | null } {
  const posts = getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: posts[index + 1] ?? null, // older
    next: posts[index - 1] ?? null, // newer
  };
}

/** Categories that actually have posts, in POST_CATEGORIES order. */
export function getUsedCategories(): PostCategory[] {
  const used = new Set(getAllPosts().map((post) => post.category));
  return POST_CATEGORIES.filter((category) => used.has(category));
}
