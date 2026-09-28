"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

/**
 * Phone-only bottom bar so Download is reachable in one tap from anywhere on
 * the page. Hides once #download scrolls into view (no point stacking a CTA
 * on top of the section it duplicates), and reappears once it scrolls back
 * out. Hidden entirely on md+ where the product bar's own Download button
 * is already visible.
 */
export function ZenStickyDownload() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const target = document.getElementById("download");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), {
      rootMargin: "0px",
      threshold: 0,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-lg transition-transform duration-200 md:hidden ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <a
        href="#download"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-foreground bg-foreground px-4 py-3 font-sans text-sm font-semibold text-background"
      >
        <Download className="h-4 w-4" />
        Download Zen
      </a>
    </div>
  );
}
