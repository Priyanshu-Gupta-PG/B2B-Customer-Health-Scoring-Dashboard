import { prisma } from "../infrastructure/prisma.js";
import { recalculateAll } from "../engine/RecalculationService.js";
import { logger } from "../infrastructure/logger.js";
import { ScoringCalculator } from "../engine/ScoringCalculator.js";

function jitter(value: number, spread: number, floor = 0) {
  return Math.max(floor, value + Math.round((Math.random() - 0.5) * spread));
}

export async function acquireLock(name: string): Promise<boolean> {
  try {
    await prisma.jobLock.create({ data: { name, lockedAt: new Date() } });
    return true;
  } catch {
    const existing = await prisma.jobLock.findUnique({ where: { name } });
    if (existing && Date.now() - existing.lockedAt.getTime() > 10 * 60_000) {
      await prisma.jobLock.delete({ where: { name } }).catch(() => undefined);
      return acquireLock(name);
    }
    return false;
  }
}

export async function releaseLock(name: string) {
  await prisma.jobLock.delete({ where: { name } }).catch(() => undefined);
}

export async function runIngestion() {
  const locked = await acquireLock("ingestion");
  if (!locked) {
    logger.warn("ingestion skipped — lock held");
    return { skipped: true, accounts: 0 };
  }

  try {
    await prisma.systemState.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", cronStatus: "running" },
      update: { cronStatus: "running" },
    });

    const accounts = await prisma.account.findMany({ include: { metrics: true } });
    for (const account of accounts) {
      if (Math.random() > 0.2) continue;
      const current = Object.fromEntries(account.metrics.map((m) => [m.metricType, Number(m.metricValue)]));
      const next = {
        product_usage: jitter(current.product_usage ?? 20, 10),
        support_tickets: jitter(current.support_tickets ?? 1, 3),
        overdue_invoice: jitter(current.overdue_invoice ?? 0, 2),
      };
      const now = new Date();
      for (const [type, value] of Object.entries(next)) {
        const source = type === "product_usage" ? "product" : type === "support_tickets" ? "zendesk" : "stripe";
        await prisma.accountMetric.upsert({
          where: { accountId_metricType: { accountId: account.id, metricType: type } },
          create: {
            accountId: account.id,
            sourceApi: source,
            metricType: type,
            metricValue: value,
            recordedAt: now,
          },
          update: { metricValue: value, recordedAt: now },
        });
      }
      await prisma.account.update({
        where: { id: account.id },
        data: { lastActiveAt: now },
      });
    }

    const result = await recalculateAll();
    await prisma.systemState.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", cronStatus: "idle", lastIngestionAt: new Date() },
      update: { cronStatus: "idle", lastIngestionAt: new Date() },
    });
    logger.info({ accounts: result.accounts, durationMs: result.durationMs }, "ingestion complete");
    return { skipped: false, accounts: result.accounts };
  } catch (err) {
    await prisma.systemState.update({
      where: { id: "singleton" },
      data: { cronStatus: "stalled" },
    }).catch(() => undefined);
    logger.error({ err }, "ingestion failed");
    throw err;
  } finally {
    await releaseLock("ingestion");
  }
}

export async function runDailySnapshots() {
  const locked = await acquireLock("snapshots");
  if (!locked) return;
  try {
    const accounts = await prisma.account.findMany();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.scoreSnapshot.createMany({
      data: accounts.map((a) => ({
        accountId: a.id,
        calculatedScore: a.currentScore,
        healthStatus: a.healthStatus || ScoringCalculator.getStatusTier(a.currentScore),
        recordedAt: today,
      })),
    });
    logger.info({ count: accounts.length }, "daily snapshots written");
  } finally {
    await releaseLock("snapshots");
  }
}
