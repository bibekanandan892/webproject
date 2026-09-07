import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderMarkdown } from "./markdown";
import { POST_CATEGORIES } from "./types";
import type { Post, PostCategory, PostFrontmatter, PostMeta } from "./types";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");
const WORDS_PER_MINUTE = 220;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
  const { title, date, category, summary, tags, draft } = data;

  if (typeof title !== "string" || !title.trim()) fail(slug, "`title` is required");
  if (typeof summary !== "string" || !summary.trim()) fail(slug, "`summary` is required");
  if (typeof date !== "string" || !DATE_PATTERN.test(date)) {
    fail(slug, "`date` must be a YYYY-MM-DD string");
  }
  if (typeof category !== "string" || !POST_CATEGORIES.includes(category as PostCategory)) {
    fail(slug, `\`category\` must be one of ${POST_CATEGORIES.join(", ")}`);
  }
  if (tags !== undefined && !Array.isArray(tags)) fail(slug, "`tags` must be a list");

  return {
    title: title.trim(),
    date,
    category: category as PostCategory,
    summary: summary.trim(),
    tags: Array.isArray(tags) ? tags.map(String) : [],
    draft: draft === true,
  };
}

function readingMinutes(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
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

/** Every published post, newest first. */
export function getAllPosts(): PostMeta[] {
  return listSlugs()
    .map((slug) => readPostFile(slug).meta)
    .filter((post) => includeDrafts || !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
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
