import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

let startPromise: Promise<void> | null = null;

/** Idempotent start so React Strict Mode remounts do not call `configure()` twice. */
export function startMocks() {
  if (!startPromise) {
    startPromise = worker
      .start({
        onUnhandledFrame: "bypass",
        quiet: true,
        serviceWorker: { url: "/mockServiceWorker.js" },
      })
      .then(() => undefined);
  }
  return startPromise;
}
