import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeAccounts } from "./lib/accounts.mjs";
import { isoNow, pick, randomInt } from "./lib/random.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = join(root, "public");

const PRIORITIES = ["low", "normal", "high", "urgent"];

function buildPayload(accounts) {
  return {
    source: "zendesk",
    endpoint: "/mock/zendesk/tickets",
    generated_at: isoNow(),
    note: "Dummy Zendesk-like ticket feed. Values regenerate on every request.",
    data: accounts.map((account) => {
      const open = randomInt(0, 12);
      return {
        account_id: account.id,
        domain: account.domain,
        company_name: account.company_name,
        organization_ref: `org_${(account.domain || account.id).replace(/[^a-z0-9]/gi, "").slice(0, 14)}`,
        open_tickets: open,
        pending_tickets: randomInt(0, Math.max(2, Math.floor(open / 2))),
        highest_priority: open === 0 ? "none" : pick(PRIORITIES),
        metric: { type: "support_tickets", value: open, unit: "tickets" },
      };
    }),
  };
}

function handleTickets(req, res) {
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

app.get("/health", (_req, res) => res.json({ status: "ok", service: "zendesk-mock" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end());
app.get("/mock/zendesk/tickets", handleTickets);
app.post("/mock/zendesk/tickets", handleTickets);
app.get("/api/tickets", handleTickets);
app.post("/api/tickets", handleTickets);

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
