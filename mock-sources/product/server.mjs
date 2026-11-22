import { createMockApp, listen, mountStatic, publicPath } from "../shared/http.mjs";
import { normalizeAccounts } from "../shared/accounts.mjs";
import { isoNow, randomInt } from "../shared/random.mjs";

process.env.MOCK_SERVICE_NAME = "product-mock";
const PORT = Number(process.env.PORT ?? 4103);
const app = createMockApp();

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
        metric: {
          type: "product_usage",
          value: logins,
          unit: "logins",
        },
      };
    }),
  };
}

function handleUsage(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const accounts = normalizeAccounts(req.method === "POST" ? req.body : { accounts: undefined });
  res.json(buildPayload(accounts));
}

app.get("/mock/product/usage", handleUsage);
app.post("/mock/product/usage", handleUsage);
app.get("/api/usage", handleUsage);
app.post("/api/usage", handleUsage);

mountStatic(app, publicPath(import.meta.url));
await listen(app, PORT, "Product usage mock");
