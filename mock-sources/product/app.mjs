import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeAccounts } from "./lib/accounts.mjs";
import { isoNow, randomInt } from "./lib/random.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = join(root, "public");

function buildPayload(accounts) {
  return {
    source: "product",
    endpoint: "/mock/product/usage",
    generated_at: isoNow(),
    note: "Dummy product-usage feed. Active logins regenerate on every request.",
    data: accounts.map((account) => {
      const logins = randomInt(0, 80);
      return {
        account_id: account.id,
        domain: account.domain,
        company_name: account.company_name,
        tenant_ref: `ten_${(account.domain || account.id).replace(/[^a-z0-9]/gi, "").slice(0, 14)}`,
        active_logins_30d: logins,
        unique_users_7d: Math.max(1, Math.floor(logins / randomInt(2, 5))),
        last_seen_hours_ago: randomInt(0, 72),
        metric: { type: "product_usage", value: logins, unit: "logins" },
      };
    }),
  };
}

function handleUsage(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const accounts = normalizeAccounts(req.method === "POST" ? req.body : { accounts: undefined });
  res.json(buildPayload(accounts));
}

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "product-mock" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end());
app.get("/mock/product/usage", handleUsage);
app.post("/mock/product/usage", handleUsage);
app.get("/api/usage", handleUsage);
app.post("/api/usage", handleUsage);

app.use(
  express.static(publicDir, {
    etag: false,
    lastModified: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".js") || filePath.endsWith(".html") || filePath.endsWith(".css")) {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  }),
);

export default app;
