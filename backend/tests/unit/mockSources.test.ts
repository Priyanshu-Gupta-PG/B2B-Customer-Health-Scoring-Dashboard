import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";

describe("mockSources client", () => {
  let base = "";
  let server: ReturnType<typeof createServer>;

  before(async () => {
    server = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const accounts = body ? (JSON.parse(body).accounts as Array<{ id: string; domain: string }>) : [];
        const path = req.url ?? "";
        const data = accounts.map((a, i) => {
          if (path.includes("stripe")) {
            return { account_id: a.id, domain: a.domain, overdue_invoices: i + 1, metric: { value: i + 1 } };
          }
          if (path.includes("zendesk")) {
            return { account_id: a.id, domain: a.domain, open_tickets: i + 2, metric: { value: i + 2 } };
          }
          return { account_id: a.id, domain: a.domain, active_logins_30d: 40 + i, metric: { value: 40 + i } };
        });
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ data }));
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const addr = server.address() as AddressInfo;
    base = `http://127.0.0.1:${addr.port}`;
    process.env.STRIPE_MOCK_URL = base;
    process.env.ZENDESK_MOCK_URL = base;
    process.env.PRODUCT_MOCK_URL = base;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  it("merges Stripe, Zendesk, and product metrics by account id", async () => {
    // Re-import after env is set so config picks up URLs.
    const { fetchMetricsFromMockSources } = await import("../../src/workers/mockSources.js");
    const map = await fetchMetricsFromMockSources([
      { id: "a1", domain: "acme.com", company_name: "Acme" },
      { id: "a2", domain: "globex.com", company_name: "Globex" },
    ]);
    assert.equal(map.size, 2);
    assert.deepEqual(map.get("a1"), {
      overdue_invoice: 1,
      support_tickets: 2,
      product_usage: 40,
    });
    assert.deepEqual(map.get("a2"), {
      overdue_invoice: 2,
      support_tickets: 3,
      product_usage: 41,
    });
  });
});
