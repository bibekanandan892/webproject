import "katex/dist/katex.min.css";

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PostMetaRow } from "@/components/blog/post-meta-row";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { getAdjacentPosts, getPostBySlug, getPublishedSlugs } from "@/lib/blog";
import type { PostMeta } from "@/lib/blog/types";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const url = `https://bibekananda.in/blog/${slug}/`;

  return {
    title: post.title,
    description: post.summary,
    keywords: [...post.tags],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      url,
      publishedTime: post.date,
      tags: [...post.tags],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
    },
  };
}

function AdjacentLink({ post, direction }: { post: PostMeta; direction: "prev" | "next" }) {
  const isPrev = direction === "prev";
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:bg-secondary ${
        isPrev ? "items-start text-left" : "items-end text-right"
      }`}
    >
      <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
        {isPrev && <ArrowLeft className="h-3 w-3" />}
        {isPrev ? "older" : "newer"}
        {!isPrev && <ArrowRight className="h-3 w-3" />}
      </span>
      <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
        {post.title}
      </span>
    </Link>
  );
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const { prev, next } = getAdjacentPosts(slug);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 font-mono text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> all posts
      </Link>

      <div className="mt-10 gap-12 xl:flex xl:items-start">
        <article className="min-w-0 flex-1 xl:max-w-3xl">
          <header className="flex flex-col gap-4 border-b border-border pb-8">
            <PostMetaRow
              date={post.date}
              category={post.category}
              readingMinutes={post.readingMinutes}
            />
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              {post.title}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">{post.summary}</p>
          </header>

          <div
            className="prose-post mt-10"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          {(prev || next) && (
            <nav
              aria-label="More posts"
              className="mt-16 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row"
            >
              {prev && <AdjacentLink post={prev} direction="prev" />}
              {next && <AdjacentLink post={next} direction="next" />}
            </nav>
          )}
        </article>

        <aside className="sticky top-24 hidden w-60 shrink-0 xl:block">
          <TableOfContents headings={post.headings} />
        </aside>
      </div>
    </div>
  );
}
