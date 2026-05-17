"use client";

import { useState } from "react";

interface AdminGateProps {
  isAdmin: boolean;
  onUnlock: () => void;
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

export function AdminGate({ isAdmin, onUnlock }: AdminGateProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (isAdmin) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--primary)]">
        <span className="size-1.5 rounded-full bg-[var(--primary)]" />
        Admin mode — "Make main" buttons enabled
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Admin"
        className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-xs text-[var(--muted-foreground)] transition hover:bg-white/10 hover:text-[var(--foreground)]"
        title="Admin"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ADMIN_PASSWORD) {
      setError(true);
      return;
    }
    if (value === ADMIN_PASSWORD) {
      onUnlock();
      setOpen(false);
      setValue("");
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <form onSubmit={submit} className="inline-flex items-center gap-2">
      <input
        type="password"
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(false);
        }}
        placeholder="Admin password"
        className={`rounded-md border bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] ${error ? "border-red-500" : "border-white/10"}`}
      />
      <button
        type="submit"
        className="rounded-md border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-white/10"
      >
        Unlock
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setValue("");
          setError(false);
        }}
        className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        Cancel
      </button>
    </form>
  );
}
