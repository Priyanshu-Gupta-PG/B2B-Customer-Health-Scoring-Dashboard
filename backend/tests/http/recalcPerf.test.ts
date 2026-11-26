import "./setup-env.js";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "../../src/infrastructure/prisma.js";
import { recalculateAll } from "../../src/engine/RecalculationService.js";

const TARGET = 1_000;
const BUDGET_MS = 1_000;

function uuid(n: number) {
  const hex = n.toString(16).padStart(12, "0");
  return `10000000-0000-4000-8000-${hex}`;
}

describe("PRD recalculation performance (1,000 accounts < 1s)", () => {
  let dbReady = false;

  before(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      dbReady = true;
    } catch {
      dbReady = false;
    }
  });

  after(async () => {
    if (!dbReady) return;
    // Remove only the perf-test accounts we inserted.
    await prisma.account.deleteMany({
      where: { id: { startsWith: "10000000-0000-4000-8000-" } },
    }).catch(() => undefined);
    await prisma.$disconnect().catch(() => undefined);
  });

  it("recalculates 1,000 accounts in under 1 second", async (t) => {
    if (!dbReady) {
      t.skip("PostgreSQL is not available");
      return;
    }

    const rules = await prisma.scoringRule.findMany({ where: { isActive: true } });
    if (rules.length === 0) {
      t.skip("No scoring rules seeded — run demo seed first");
      return;
    }

    const existing = await prisma.account.count({
      where: { id: { startsWith: "10000000-0000-4000-8000-" } },
    });
    const need = TARGET - existing;
    if (need > 0) {
      const start = existing;
      const accounts = Array.from({ length: need }, (_, i) => {
        const n = start + i;
        return {
          id: uuid(n),
          companyName: `Perf Account ${n}`,
          domain: `perf${n}.example.com`,
          plan: "Growth",
          ownerCsm: "Perf Bot",
          arr: 10_000 + n,
          currentScore: 50,
          healthStatus: "At-Risk",
        };
      });
      // createMany in chunks
      for (let i = 0; i < accounts.length; i += 200) {
        await prisma.account.createMany({ data: accounts.slice(i, i + 200) });
      }
      const metrics = accounts.flatMap((a, idx) => [
        {
          accountId: a.id,
          sourceApi: "product",
          metricType: "product_usage",
          metricValue: 20 + (idx % 40),
        },
        {
          accountId: a.id,
          sourceApi: "zendesk",
          metricType: "support_tickets",
          metricValue: idx % 8,
        },
        {
          accountId: a.id,
          sourceApi: "stripe",
          metricType: "overdue_invoice",
          metricValue: idx % 4,
        },
      ]);
      for (let i = 0; i < metrics.length; i += 600) {
        await prisma.accountMetric.createMany({ data: metrics.slice(i, i + 600) });
      }
    }

    const total = await prisma.account.count();
    assert.ok(total >= TARGET, `expected at least ${TARGET} accounts, got ${total}`);

    const result = await recalculateAll();
    assert.ok(result.accounts >= TARGET, `recalculated ${result.accounts}`);
    assert.ok(
      result.durationMs < BUDGET_MS,
      `recalculation took ${result.durationMs}ms (budget ${BUDGET_MS}ms)`,
    );
  });
});
