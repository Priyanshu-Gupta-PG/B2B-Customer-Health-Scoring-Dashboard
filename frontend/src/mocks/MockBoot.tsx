"use client";

import { useEffect } from "react";

/**
 * Client-only MSW boot. Isolated so `msw/browser` (package export `node: null`)
 * is never resolved during SSR / `next build`.
 * After the worker starts, hydrate account metrics from the live mock websites.
 */
export default function MockBoot({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { startMocks } = await import("./browser");
        await startMocks();
        const { mockDb } = await import("./db");
        await mockDb().hydrateFromMockWebsites();
      } catch (err) {
        console.error("[mocks] failed to start or hydrate from mock websites", err);
      } finally {
        if (!cancelled) onReady();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onReady]);

  return null;
}
