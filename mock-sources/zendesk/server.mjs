import { createMockApp, listen, publicPath } from "../shared/http.mjs";
import { normalizeAccounts } from "../shared/accounts.mjs";
import { isoNow, pick, randomInt } from "../shared/random.mjs";

process.env.MOCK_SERVICE_NAME = "zendesk-mock";
const PORT = Number(process.env.PORT ?? 4102);
const app = createMockApp({ publicDir: publicPath(import.meta.url) });

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
        metric: {
          type: "support_tickets",
          value: open,
          unit: "tickets",
        },
      };
    }),
  };
}

function handleTickets(req, res) {
  const accounts = normalizeAccounts(req.method === "POST" ? req.body : { accounts: undefined });
  res.json(buildPayload(accounts));
}

app.get("/mock/zendesk/tickets", handleTickets);
app.post("/mock/zendesk/tickets", handleTickets);
app.get("/api/tickets", handleTickets);
app.post("/api/tickets", handleTickets);

await listen(app, PORT, "Zendesk mock");
