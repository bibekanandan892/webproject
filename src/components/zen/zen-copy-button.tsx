"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function ZenCopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API unavailable (permissions, insecure context) — the hash
      // is still visible in the DOM for a manual copy.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label} SHA-256 checksum`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 font-mono text-[11px] text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-[color:var(--zen-learn)]" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
