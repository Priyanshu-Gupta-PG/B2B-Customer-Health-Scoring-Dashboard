import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeAccounts } from "./lib/accounts.mjs";
import { isoNow, pick, randomInt } from "./lib/random.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = join(root, "public");

const STATUSES = ["open", "past_due", "paid", "void"];

function buildPayload(accounts) {
  return {
    source: "stripe",
    endpoint: "/mock/stripe/invoices",
    generated_at: isoNow(),
    note: "Dummy Stripe-like invoice feed. Values regenerate on every request.",
    data: accounts.map((account) => {
      const overdue = randomInt(0, 5);
      const open = overdue + randomInt(0, 3);
      return {
        account_id: account.id,
        domain: account.domain,
        company_name: account.company_name,
        customer_ref: `cus_${(account.domain || account.id).replace(/[^a-z0-9]/gi, "").slice(0, 14)}`,
        overdue_invoices: overdue,
        open_invoices: open,
        latest_status: overdue > 0 ? "past_due" : pick(STATUSES),
        currency: "usd",
        metric: { type: "overdue_invoice", value: overdue, unit: "invoices" },
      };
    }),
  };
}

function handleInvoices(req, res) {
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

app.get("/health", (_req, res) => res.json({ status: "ok", service: "stripe-mock" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end());
app.get("/mock/stripe/invoices", handleInvoices);
app.post("/mock/stripe/invoices", handleInvoices);
app.get("/api/invoices", handleInvoices);
app.post("/api/invoices", handleInvoices);

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
