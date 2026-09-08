/** Categories a post can belong to. Frontmatter is validated against this list. */
export const POST_CATEGORIES = ["AI", "Android"] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

/** The fields an author writes at the top of a markdown file. */
export interface PostFrontmatter {
  title: string;
  /**
   * `YYYY-MM-DD`, optionally with `THH:mm`. Only the date is ever shown; the
   * time is what orders posts published on the same day.
   */
  date: string;
  category: PostCategory;
  tags: readonly string[];
  summary: string;
  draft: boolean;
  /**
   * Optional path to a cover image under `public/`, e.g. `/blog/kv-cache.png`.
   * When absent the card renders a generated thumbnail derived from the slug,
   * so a post never needs an image to look finished.
   */
  cover?: string;
}

/** Everything needed to render a post card, without parsing the body. */
export interface PostMeta extends PostFrontmatter {
  slug: string;
  readingMinutes: number;
}

/** A heading lifted out of the body to build the table of contents. */
export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** A fully rendered post. */
export interface Post extends PostMeta {
  html: string;
  headings: readonly Heading[];
}
