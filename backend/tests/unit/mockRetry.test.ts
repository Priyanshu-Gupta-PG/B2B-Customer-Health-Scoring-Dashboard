import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import { postSourceWithRetry } from "../../src/workers/mockSources.js";

describe("postSourceWithRetry", () => {
  let base = "";
  let server: ReturnType<typeof createServer>;
  let hits = 0;

  before(async () => {
    hits = 0;
    server = createServer((_req, res) => {
      hits += 1;
      if (hits < 3) {
        res.writeHead(503, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "busy" }));
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ data: [{ account_id: "a1", overdue_invoices: 2 }] }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const addr = server.address() as AddressInfo;
    base = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  it("retries transient failures then returns data", async () => {
    hits = 0;
    const rows = await postSourceWithRetry(base, "/mock/stripe/invoices", [
      { id: "a1", domain: "a1.test", company_name: "A1" },
    ]);
    assert.equal(hits, 3);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.overdue_invoices, 2);
  });
});
