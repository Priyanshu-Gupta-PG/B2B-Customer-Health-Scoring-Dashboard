import { prisma } from "../infrastructure/prisma.js";
import { METRIC_NORMALISERS, ScoringCalculator } from "./ScoringCalculator.js";
import { notifyCriticalTransitions } from "../services/AlertService.js";
import { createPlaybookTasksForDrops } from "../services/PlaybookService.js";
import { syncScoresToCrm } from "../services/CrmSyncService.js";

function startOfUtcDay(d = new Date()) {
  const day = new Date(d);
  day.setUTCHours(0, 0, 0, 0);
  return day;
}

type ScoredRow = {
  id: string;
  companyName: string;
  domain: string;
  arr: number;
  previousScore: number;
  previousStatus: string;
  score: number;
  status: string;
};

/**
 * Score every account in memory, then persist with batched SQL.
 * PRD acceptance: 1,000 accounts recalculated in under 1 second.
 */
export async function recalculateAll(): Promise<{ accounts: number; durationMs: number }> {
  const started = Date.now();
  const [rules, accounts] = await Promise.all([
    prisma.scoringRule.findMany({ where: { isActive: true } }),
    prisma.account.findMany({ include: { metrics: true } }),
  ]);

  if (accounts.length === 0) {
    return { accounts: 0, durationMs: Math.max(1, Date.now() - started) };
  }

  const today = startOfUtcDay();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const scored: ScoredRow[] = accounts.map((account) => {
    const inputs = rules.map((rule) => {
      const row = account.metrics.find((m) => m.metricType === rule.metricName);
      return {
        metricType: rule.metricName,
        rawValue: row ? Number(row.metricValue) : 0,
        weight: rule.weightPercentage,
        direction: rule.impactDirection as "positive" | "negative",
        normaliseBy: METRIC_NORMALISERS[rule.metricName] ?? 1,
      };
    });
    const score = ScoringCalculator.calculate(inputs);
    const status = ScoringCalculator.getStatusTier(score);
    return {
      id: account.id,
      companyName: account.companyName,
      domain: account.domain,
      arr: account.arr,
      previousScore: account.currentScore,
      previousStatus: account.healthStatus,
      score,
      status,
    };
  });

  const ids = scored.map((r) => r.id);
  const scores = scored.map((r) => r.score);
  const statuses = scored.map((r) => r.status);

  // Batch update accounts + upsert today's snapshots (delete today's rows, then insert).
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE accounts AS a
      SET
        current_score = data.score,
        health_status = data.status,
        updated_at = NOW()
      FROM unnest(
        ${ids}::text[],
        ${scores}::int[],
        ${statuses}::text[]
      ) AS data(id, score, status)
      WHERE a.id = data.id
    `;

    await tx.scoreSnapshot.deleteMany({
      where: {
        accountId: { in: ids },
        recordedAt: { gte: today, lt: tomorrow },
      },
    });

    await tx.scoreSnapshot.createMany({
      data: scored.map((r) => ({
        accountId: r.id,
        calculatedScore: r.score,
        healthStatus: r.status,
        recordedAt: today,
      })),
    });
  }, { timeout: 30_000 });

  const criticalTransitions = scored
    .filter((r) => r.previousStatus !== r.status && r.status === "Critical")
    .map((r) => ({
      id: r.id,
      companyName: r.companyName,
      previousStatus: r.previousStatus,
      newStatus: r.status,
      score: r.score,
      arr: r.arr,
    }));

  const playbookCandidates = scored
    .filter((r) => r.previousScore >= 40 && r.score < 40)
    .map((r) => ({
      id: r.id,
      companyName: r.companyName,
      previousScore: r.previousScore,
      score: r.score,
    }));

  const crmPayload = scored.map((r) => ({
    id: r.id,
    companyName: r.companyName,
    domain: r.domain,
    score: r.score,
    healthStatus: r.status,
    arr: r.arr,
  }));

  // Fire-and-forget side effects — never fail the recalculation path.
  if (criticalTransitions.length > 0) {
    void notifyCriticalTransitions(criticalTransitions).catch(() => undefined);
  }
  if (playbookCandidates.length > 0) {
    void createPlaybookTasksForDrops(playbookCandidates).catch(() => undefined);
  }
  void syncScoresToCrm(crmPayload).catch(() => undefined);

  return { accounts: scored.length, durationMs: Math.max(1, Date.now() - started) };
}
