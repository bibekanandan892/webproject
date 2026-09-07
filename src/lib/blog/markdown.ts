import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import type { Plugin } from "unified";
import type { Root, RootContent } from "hast";
import type { Heading } from "./types";

const SHIKI_THEME = "github-dark-default";

/** Flattens a hast subtree down to its visible text. */
function textOf(node: RootContent): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return node.children.map(textOf).join("");
  return "";
}

/**
 * Collects h2/h3 headings into `sink`. Must run after rehype-slug (so ids
 * exist) and before rehype-autolink-headings (so the injected anchor link
 * does not leak into the heading text).
 */
function rehypeCollectHeadings(sink: Heading[]): Plugin<[], Root> {
  return () => (tree: Root) => {
    const walk = (nodes: RootContent[]) => {
      for (const node of nodes) {
        if (node.type === "element" && (node.tagName === "h2" || node.tagName === "h3")) {
          const id = typeof node.properties?.id === "string" ? node.properties.id : "";
          if (id) {
            sink.push({
              id,
              text: node.children.map(textOf).join("").trim(),
              level: node.tagName === "h2" ? 2 : 3,
            });
          }
        }
        if ("children" in node) walk(node.children as RootContent[]);
      }
    };
    walk(tree.children);
  };
}

export interface RenderedMarkdown {
  html: string;
  headings: Heading[];
}

/**
 * Renders a post body to HTML at build time.
 *
 * Raw HTML is deliberately allowed: post bodies are authored in this repo, not
 * submitted by users, and inline SVG is how diagrams get into a post.
 */
export async function renderMarkdown(body: string): Promise<RenderedMarkdown> {
  const headings: Heading[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeCollectHeadings(headings))
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["heading-anchor"] },
    })
    .use(rehypeKatex)
    .use(rehypePrettyCode, { theme: SHIKI_THEME, keepBackground: false })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(body);

  return { html: String(file), headings };
}
