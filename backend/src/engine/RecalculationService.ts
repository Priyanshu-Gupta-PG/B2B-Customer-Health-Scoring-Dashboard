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

export async function recalculateAll(): Promise<{ accounts: number; durationMs: number }> {
  const started = Date.now();
  const [rules, accounts] = await Promise.all([
    prisma.scoringRule.findMany({ where: { isActive: true } }),
    prisma.account.findMany({ include: { metrics: true } }),
  ]);

  const today = startOfUtcDay();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const criticalTransitions: Array<{
    id: string;
    companyName: string;
    previousStatus: string;
    newStatus: string;
    score: number;
    arr: number;
  }> = [];
  const playbookCandidates: Array<{
    id: string;
    companyName: string;
    previousScore: number;
    score: number;
  }> = [];
  const crmPayload: Array<{
    id: string;
    companyName: string;
    domain: string;
    score: number;
    healthStatus: string;
    arr: number;
  }> = [];

  await prisma.$transaction(async (tx) => {
    for (const account of accounts) {
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

      if (account.healthStatus !== status && status === "Critical") {
        criticalTransitions.push({
          id: account.id,
          companyName: account.companyName,
          previousStatus: account.healthStatus,
          newStatus: status,
          score,
          arr: account.arr,
        });
      }
      if (account.currentScore >= 40 && score < 40) {
        playbookCandidates.push({
          id: account.id,
          companyName: account.companyName,
          previousScore: account.currentScore,
          score,
        });
      }

      crmPayload.push({
        id: account.id,
        companyName: account.companyName,
        domain: account.domain,
        score,
        healthStatus: status,
        arr: account.arr,
      });

      await tx.account.update({
        where: { id: account.id },
        data: { currentScore: score, healthStatus: status },
      });

      // US-002: persist a timestamped snapshot on every recalculation (upsert today's row).
      const existing = await tx.scoreSnapshot.findFirst({
        where: {
          accountId: account.id,
          recordedAt: { gte: today, lt: tomorrow },
        },
        select: { id: true },
      });
      if (existing) {
        await tx.scoreSnapshot.update({
          where: { id: existing.id },
          data: { calculatedScore: score, healthStatus: status, recordedAt: today },
        });
      } else {
        await tx.scoreSnapshot.create({
          data: {
            accountId: account.id,
            calculatedScore: score,
            healthStatus: status,
            recordedAt: today,
          },
        });
      }
    }
  });

  // Side effects outside the DB transaction (PRD F-009 / F-010 / F-011).
  if (criticalTransitions.length > 0) {
    void notifyCriticalTransitions(criticalTransitions);
  }
  if (playbookCandidates.length > 0) {
    void createPlaybookTasksForDrops(playbookCandidates);
  }
  void syncScoresToCrm(crmPayload);

  return { accounts: accounts.length, durationMs: Math.max(1, Date.now() - started) };
}
