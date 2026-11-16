import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

let startPromise: Promise<void> | null = null;

const START_TIMEOUT_MS = 2500;

/** Idempotent start so React Strict Mode remounts do not call `configure()` twice. */
export function startMocks() {
  if (!startPromise) {
    const start = worker
      .start({
        onUnhandledFrame: "bypass",
        quiet: true,
        serviceWorker: { url: "/mockServiceWorker.js" },
      })
      .then(() => undefined);

    // Some browsers / hosts never resolve SW registration; never block the UI forever.
    const timeout = new Promise<void>((resolve) => {
      window.setTimeout(() => {
        console.warn("[mocks] service worker start timed out; continuing without waiting");
        resolve();
      }, START_TIMEOUT_MS);
    });

    startPromise = Promise.race([start, timeout]).catch((err) => {
      console.error("[mocks] failed to start service worker", err);
    });
  }
  return startPromise;
}
