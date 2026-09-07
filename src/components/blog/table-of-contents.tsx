"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/blog/types";

/** Highlights the heading nearest the top of the viewport as the reader scrolls. */
function useActiveHeading(headings: readonly Heading[]): string {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const onScreen = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (onScreen[0]) setActiveId(onScreen[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

/** Sticky in-article navigation. Hidden below `xl` where there is no room for it. */
export function TableOfContents({ headings }: { headings: readonly Heading[] }) {
  const activeId = useActiveHeading(headings);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="flex flex-col gap-3">
      <p className="font-mono text-xs uppercase tracking-wider text-primary">on this page</p>
      <ul className="flex flex-col gap-2 border-l border-border">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`-ml-px block border-l py-0.5 text-sm leading-snug transition-colors ${
                heading.level === 3 ? "pl-7" : "pl-4"
              } ${
                activeId === heading.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
