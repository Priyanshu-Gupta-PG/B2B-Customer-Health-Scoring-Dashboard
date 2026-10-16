"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertBanner } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { env } from "@/lib/env";
import { toApiError } from "@/lib/errors";
import { useAuth } from "./AuthProvider";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
        };
      };
    };
  }
}

function safeNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) return "/dashboard";
  return next;
}

function loadGis(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const src = "https://accounts.google.com/gsi/client";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    const script = existing ?? document.createElement("script");
    const done = () => {
      if (window.google?.accounts?.id) resolve();
      else reject(new Error("Google sign-in failed to load."));
    };
    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", () => reject(new Error("Google sign-in failed to load.")), { once: true });
    if (!existing) {
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    } else if (window.google?.accounts?.id) {
      resolve();
    }
  });
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.2l6.3 5.3C37.4 38.4 44 33 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export function GoogleSignUp() {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const host = useRef<HTMLDivElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const expired = search.get("reason") === "expired";
  const next = search.get("next");

  useEffect(() => {
    if (!env.googleClientId || !host.current) return;
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !host.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: env.googleClientId,
          callback: (response) => {
            void (async () => {
              setServerError(null);
              setPending(true);
              try {
                await loginWithGoogle(response.credential);
                router.replace(safeNext(next));
              } catch (err) {
                const e = toApiError(err);
                setServerError(e.status === 401 ? "Google sign-up was rejected." : e.message);
              } finally {
                setPending(false);
              }
            })();
          },
        });
        host.current.replaceChildren();
        window.google.accounts.id.renderButton(host.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signup_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: host.current.clientWidth || 384,
        });
        setGisReady(true);
      })
      .catch(() => {
        if (!cancelled) setServerError("Google sign-in failed to load. Check your connection and try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle, next, router]);

  return (
    <div className="flex flex-col gap-4">
      {expired && !serverError && <AlertBanner tone="warning">Your session expired. Please sign up again.</AlertBanner>}

      {env.googleClientId ? (
        <div ref={host} className="flex min-h-11 w-full items-center justify-center" />
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() =>
            setServerError("Google sign-up is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID.")
          }
        >
          <GoogleMark />
          Sign up with Google
        </Button>
      )}

      {env.googleClientId && !gisReady && !serverError ? (
        <p className="text-center text-xs text-text-muted">Loading Google sign-up…</p>
      ) : null}

      {pending ? <p className="text-center text-sm text-text-muted">Creating your account…</p> : null}

      {serverError && (
        <p className="text-sm text-danger" role="alert">
          {serverError}
        </p>
      )}
    </div>
  );
}
