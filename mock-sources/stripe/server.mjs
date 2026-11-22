import { createMockApp, listen, mountStatic, publicPath } from "../shared/http.mjs";
import { normalizeAccounts } from "../shared/accounts.mjs";
import { isoNow, pick, randomInt } from "../shared/random.mjs";

process.env.MOCK_SERVICE_NAME = "stripe-mock";
const PORT = Number(process.env.PORT ?? 4101);
const app = createMockApp();

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
        metric: {
          type: "overdue_invoice",
          value: overdue,
          unit: "invoices",
        },
      };
    }),
  };
}

function handleInvoices(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const accounts = normalizeAccounts(req.method === "POST" ? req.body : { accounts: undefined });
  res.json(buildPayload(accounts));
}

app.get("/mock/stripe/invoices", handleInvoices);
app.post("/mock/stripe/invoices", handleInvoices);
app.get("/api/invoices", handleInvoices);
app.post("/api/invoices", handleInvoices);

mountStatic(app, publicPath(import.meta.url));
await listen(app, PORT, "Stripe mock");
