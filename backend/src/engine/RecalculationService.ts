import { prisma } from "../infrastructure/prisma.js";
import { METRIC_NORMALISERS, ScoringCalculator } from "./ScoringCalculator.js";

export async function recalculateAll(): Promise<{ accounts: number; durationMs: number }> {
  const started = Date.now();
  const [rules, accounts] = await Promise.all([
    prisma.scoringRule.findMany({ where: { isActive: true } }),
    prisma.account.findMany({ include: { metrics: true } }),
  ]);

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
      await tx.account.update({
        where: { id: account.id },
        data: { currentScore: score, healthStatus: status },
      });
    }
  });

  return { accounts: accounts.length, durationMs: Math.max(1, Date.now() - started) };
}
