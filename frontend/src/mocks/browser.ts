import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

let startPromise: Promise<void> | null = null;

const START_TIMEOUT_MS = 8000;

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

    // MSW 3 waits for a MOCKING_ENABLED handshake that can stall in headless /
    // multi-host local setups. Keep the UI moving; interception often still
    // works once the worker is registered and controlling the page.
    const timeout = new Promise<void>((resolve) => {
      window.setTimeout(() => {
        const controlling = Boolean(navigator.serviceWorker?.controller);
        if (!controlling) {
          console.warn(
            "[mocks] service worker start timed out without a controller; API calls may fail until reload",
          );
        }
        resolve();
      }, START_TIMEOUT_MS);
    });

    startPromise = Promise.race([start, timeout]).catch((err) => {
      console.error("[mocks] failed to start service worker", err);
    });
  }
  return startPromise;
}
