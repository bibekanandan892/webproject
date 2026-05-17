"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const CLICK_THRESHOLD = 5;
const WINDOW_MS = 3000;

/**
 * Returns an onClick handler. Counts clicks within a 3-second rolling window.
 * On the 5th rapid click, navigates to /vote.
 */
export function usePhotoClickEgg() {
  const router = useRouter();
  const timestamps = useRef<number[]>([]);

  return useCallback(() => {
    const now = Date.now();
    const recent = timestamps.current.filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    timestamps.current = recent;
    if (recent.length >= CLICK_THRESHOLD) {
      timestamps.current = [];
      router.push("/vote/");
    }
  }, [router]);
}
