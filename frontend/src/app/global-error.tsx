"use client";

import "./globals.css";

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-text min-h-screen">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="num text-xs font-medium tracking-[0.2em] text-blue-300">ERROR</p>
          <h1 className="mt-3 text-xl font-semibold">The dashboard failed to load</h1>
          <p className="text-text-muted mt-2 max-w-md text-sm">
            A critical error stopped the application. Retry to reload, or sign in again if the
            session looks stale.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="bg-primary hover:bg-primary-hover mt-6 inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
