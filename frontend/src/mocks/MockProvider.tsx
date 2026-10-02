"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, type ReactNode } from "react";
import { env } from "@/lib/env";

const MockBoot = dynamic(() => import("./MockBoot"), { ssr: false });

/**
 * Starts the MSW service worker before rendering children so the first queries are
 * intercepted. No-op when NEXT_PUBLIC_USE_MOCKS !== "true".
 */
export function MockProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!env.useMocks);
  const onReady = useCallback(() => setReady(true), []);

  if (!env.useMocks) return <>{children}</>;

  return (
    <>
      <MockBoot onReady={onReady} />
      {ready ? (
        children
      ) : (
        <div className="text-text-muted flex min-h-screen items-center justify-center text-sm">
          Starting mock API…
        </div>
      )}
    </>
  );
}
