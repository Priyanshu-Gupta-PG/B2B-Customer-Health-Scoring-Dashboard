"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { Logo } from "./Logo";

/**
 * Client-side route guard. Tokens live in localStorage (Bearer flow), so the server
 * can't see them; we render a neutral splash until the session is known.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    const next = `/login?next=${encodeURIComponent(pathname)}`;
    router.replace(next);

    // Hard fallback if the App Router navigation stalls.
    const fallback = window.setTimeout(() => {
      if (window.location.pathname !== "/login") {
        window.location.assign(next);
      }
    }, 1500);

    return () => window.clearTimeout(fallback);
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Logo />
        <p className="text-text-muted text-xs">Checking your session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Logo />
        <p className="text-text-muted text-xs">Redirecting to sign in…</p>
      </div>
    );
  }

  return <>{children}</>;
}
