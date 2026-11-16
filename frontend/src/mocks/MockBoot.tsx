"use client";

import { useEffect } from "react";

/**
 * Client-only MSW boot. Isolated so `msw/browser` (package export `node: null`)
 * is never resolved during SSR / `next build`.
 */
export default function MockBoot({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    let cancelled = false;
    let settled = false;

    const finish = () => {
      if (cancelled || settled) return;
      settled = true;
      onReady();
    };

    // Absolute fallback if dynamic import or SW start never settles.
    const hardTimeout = window.setTimeout(finish, 4000);

    import("./browser")
      .then(({ startMocks }) => startMocks())
      .catch((err) => console.error("[mocks] failed to start service worker", err))
      .finally(() => {
        window.clearTimeout(hardTimeout);
        finish();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(hardTimeout);
    };
  }, [onReady]);

  return null;
}
