"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { env } from "@/lib/env";

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
            ux_mode?: "popup" | "redirect";
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
          cancel?: () => void;
        };
      };
    };
  }
}

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Google sign-in is browser-only."));
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
    script.addEventListener("error", () => reject(new Error("Google sign-in failed to load.")), {
      once: true,
    });
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
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.2l6.3 5.3C37.4 38.4 44 33 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

type Props = {
  onCredential: (idToken: string) => Promise<void> | void;
  disabled?: boolean;
  onError?: (message: string) => void;
};

export function GoogleSignInButton({ onCredential, disabled = false, onError }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [gisReady, setGisReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!env.googleClientId || !host.current || disabled) return;
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !host.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: env.googleClientId,
          callback: (response) => {
            void onCredentialRef.current(response.credential);
          },
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        host.current.replaceChildren();
        window.google.accounts.id.renderButton(host.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: host.current.clientWidth || 384,
        });
        setGisReady(true);
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Google sign-in failed to load. Check your connection.";
        setLoadError(message);
        onErrorRef.current?.(message);
      });
    return () => {
      cancelled = true;
      window.google?.accounts?.id?.cancel?.();
    };
  }, [disabled]);

  if (!env.googleClientId) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full gap-2"
        onClick={() =>
          onError?.(
            "Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID (frontend) and GOOGLE_CLIENT_ID (API).",
          )
        }
      >
        <GoogleMark />
        Continue with Google
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={host}
        className={`flex min-h-11 w-full items-center justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`}
        aria-busy={!gisReady}
      />
      {!gisReady && !loadError ? (
        <p className="text-center text-xs text-text-muted">Loading Google…</p>
      ) : null}
      {loadError ? (
        <p className="text-xs font-medium text-rose-400" role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
