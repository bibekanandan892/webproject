"use client";

import { useEffect } from "react";

/**
 * Mounted once near the top of the page. Adds `zen-js` to <html> (the CSS
 * pre-reveal rule in zen.css only applies once that class exists, so a
 * no-JS visitor never sees hidden content), then observes every
 * [data-zen-reveal] element and adds `is-in` once it scrolls into view.
 * Renders nothing.
 */
export function ZenReveal() {
  useEffect(() => {
    document.documentElement.classList.add("zen-js");

    const targets = document.querySelectorAll<HTMLElement>("[data-zen-reveal]");
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
