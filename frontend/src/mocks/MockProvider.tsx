"use client";

import { useEffect, useState, type ReactNode } from "react";
import { env } from "@/lib/env";

/**
 * Starts the MSW service worker before rendering children so the first queries are
 * intercepted. No-op when NEXT_PUBLIC_USE_MOCKS !== "true".
 */
export function MockProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!env.useMocks);

  useEffect(() => {
    if (!env.useMocks) return;
    let cancelled = false;
    import("./browser")
      .then(({ worker }) =>
        worker.start({
          onUnhandledRequest: "bypass",
          quiet: true,
          serviceWorker: { url: "/mockServiceWorker.js" },
        }),
      )
      .catch((err) => console.error("[mocks] failed to start service worker", err))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-text-muted">
        Starting mock API…
      </div>
    );
  }
  return <>{children}</>;
}
