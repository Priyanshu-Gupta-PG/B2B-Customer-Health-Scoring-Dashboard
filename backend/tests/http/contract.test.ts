import "./setup-env.js";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import { createApp } from "../../src/app.js";

describe("HTTP contract (no database)", () => {
  let server: Server;
  let base: string;

  before(async () => {
    process.env.NODE_ENV = "test";
    const app = createApp();
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const { port } = server.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("GET /health reports degraded postgres without a database", async () => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 503);
    const body = (await res.json()) as { status: string; postgres: string; cron_worker: string };
    assert.equal(body.status, "degraded");
    assert.equal(body.postgres, "disconnected");
    assert.ok(["idle", "running", "stalled"].includes(body.cron_worker));
  });

  it("GET /api/v1/accounts without a bearer token is 401 problem+json", async () => {
    const res = await fetch(`${base}/api/v1/accounts`);
    assert.equal(res.status, 401);
    assert.match(res.headers.get("content-type") ?? "", /application\/problem\+json/);
    const body = (await res.json()) as { title: string };
    assert.equal(body.title, "Unauthorized");
  });

  it("POST /api/v1/auth/login rejects an empty body", async () => {
    const res = await fetch(`${base}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 422);
    const body = (await res.json()) as { title: string };
    assert.equal(body.title, "Validation Error");
  });

  it("unknown routes return RFC 7807 404", async () => {
    const res = await fetch(`${base}/no-such-route`);
    assert.equal(res.status, 404);
    const body = (await res.json()) as { title: string; status: number };
    assert.equal(body.title, "Not Found");
    assert.equal(body.status, 404);
  });
});
