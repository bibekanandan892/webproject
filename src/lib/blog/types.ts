/** Categories a post can belong to. Frontmatter is validated against this list. */
export const POST_CATEGORIES = ["AI", "Android"] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

/** The fields an author writes at the top of a markdown file. */
export interface PostFrontmatter {
  title: string;
  date: string; // YYYY-MM-DD
  category: PostCategory;
  tags: readonly string[];
  summary: string;
  draft: boolean;
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
