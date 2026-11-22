import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export function createMockApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: process.env.MOCK_SERVICE_NAME ?? "mock-source" });
  });
  app.get("/favicon.ico", (_req, res) => {
    res.status(204).end();
  });
  return app;
}

/** Mount static files AFTER API routes so /mock/* is never shadowed. */
export function mountStatic(app, publicDir) {
  app.use(
    express.static(publicDir, {
      etag: false,
      lastModified: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith(".js") || filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store");
        }
      },
    }),
  );
}

export function publicPath(metaUrl) {
  return join(dirname(fileURLToPath(metaUrl)), "public");
}

export function listen(app, port, label) {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`${label} listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}
