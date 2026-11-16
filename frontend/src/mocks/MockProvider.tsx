"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { env } from "@/lib/env";

const MockBoot = dynamic(() => import("./MockBoot"), { ssr: false });

/**
 * Starts the MSW service worker in the background. Children render immediately so a
 * hanging service-worker registration cannot blank the whole app.
 */
export function MockProvider({ children }: { children: ReactNode }) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!env.useMocks) return;
    const id = window.setTimeout(() => setShowHint(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  if (!env.useMocks) return <>{children}</>;

  return (
    <>
      <MockBoot onReady={() => setShowHint(false)} />
      {children}
      {showHint ? (
        <div className="pointer-events-none fixed bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-muted shadow-sm">
          Connecting mock API…
        </div>
      ) : null}
    </>
  );
}
