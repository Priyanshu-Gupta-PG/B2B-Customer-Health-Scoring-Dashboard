import { prisma } from "../infrastructure/prisma.js";
import { recalculateAll } from "../engine/RecalculationService.js";
import { logger } from "../infrastructure/logger.js";
import { ScoringCalculator } from "../engine/ScoringCalculator.js";
import { fetchMetricsFromMockSources, mockSourcesConfigured } from "./mockSources.js";

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

async function applyMetrics(
  accountId: string,
  next: { product_usage: number; support_tickets: number; overdue_invoice: number },
  now: Date,
) {
  for (const [type, value] of Object.entries(next)) {
    const source = type === "product_usage" ? "product" : type === "support_tickets" ? "zendesk" : "stripe";
    await prisma.accountMetric.upsert({
      where: { accountId_metricType: { accountId, metricType: type } },
      create: {
        accountId,
        sourceApi: source,
        metricType: type,
        metricValue: value,
        recordedAt: now,
      },
      update: { metricValue: value, recordedAt: now },
    });
  }
  await prisma.account.update({
    where: { id: accountId },
    data: { lastActiveAt: now },
  });
}

async function ingestFromMockWebsites() {
  const accounts = await prisma.account.findMany({
    select: { id: true, domain: true, companyName: true },
  });
  const fetched = await fetchMetricsFromMockSources(
    accounts.map((a) => ({
      id: a.id,
      domain: a.domain,
      company_name: a.companyName,
    })),
  );

  const now = new Date();
  let updated = 0;
  for (const account of accounts) {
    const metrics = fetched.get(account.id);
    if (!metrics) continue;
    await applyMetrics(account.id, metrics, now);
    updated += 1;
  }
  return updated;
}

export async function runIngestion() {
  const locked = await acquireLock("ingestion");
  if (!locked) {
    logger.warn("ingestion skipped — lock held");
    return { skipped: true, accounts: 0 };
  }

  try {
    if (!mockSourcesConfigured()) {
      throw new Error(
        "Mock source URLs are not configured (STRIPE_MOCK_URL, ZENDESK_MOCK_URL, PRODUCT_MOCK_URL)",
      );
    }

    await prisma.systemState.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", cronStatus: "running" },
      update: { cronStatus: "running" },
    });

    const updated = await ingestFromMockWebsites();
    const result = await recalculateAll();
    await prisma.systemState.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", cronStatus: "idle", lastIngestionAt: new Date() },
      update: { cronStatus: "idle", lastIngestionAt: new Date() },
    });
    logger.info(
      { accounts: result.accounts, updated, mode: "mock-websites", durationMs: result.durationMs },
      "ingestion complete",
    );
    return { skipped: false, accounts: result.accounts, updated, mode: "mock-websites" as const };
  } catch (err) {
    await prisma.systemState
      .update({
        where: { id: "singleton" },
        data: { cronStatus: "stalled" },
      })
      .catch(() => undefined);
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
