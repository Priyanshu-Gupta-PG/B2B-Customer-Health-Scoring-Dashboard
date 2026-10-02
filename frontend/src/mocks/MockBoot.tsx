"use client";

import { useEffect } from "react";

/**
 * Client-only MSW boot. Isolated so `msw/browser` (package export `node: null`)
 * is never resolved during SSR / `next build`.
 */
export default function MockBoot({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    let cancelled = false;
    import("./browser")
      .then(({ startMocks }) => startMocks())
      .catch((err) => console.error("[mocks] failed to start service worker", err))
      .finally(() => {
        if (!cancelled) onReady();
      });
    return () => {
      cancelled = true;
    };
  }, [onReady]);

  return null;
}
