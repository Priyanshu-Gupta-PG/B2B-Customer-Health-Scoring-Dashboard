export type ImpactDirection = "positive" | "negative";

export interface ScoringMetricInput {
  metricType: string;
  rawValue: number;
  weight: number;
  direction: ImpactDirection;
  normaliseBy: number;
}

export const METRIC_NORMALISERS: Record<string, number> = {
  product_usage: 60,
  support_tickets: 10,
  overdue_invoice: 5,
};

export type HealthStatus = "Critical" | "At-Risk" | "Healthy";

export class ScoringCalculator {
  /**
   * Weighted linear combination of normalised metrics, clamped to a 0–100 integer.
   * Empty / zero-weight input returns the base score of 100 (UT-SC-001).
   */
  static calculate(metrics: ScoringMetricInput[]): number {
    const active = metrics.filter((m) => m.weight > 0);
    const totalWeight = active.reduce((sum, m) => sum + m.weight, 0);
    if (active.length === 0 || totalWeight === 0) return 100;

    let score = 0;
    for (const metric of active) {
      const denom = metric.normaliseBy > 0 ? metric.normaliseBy : 1;
      const norm = Math.max(0, Math.min(1, metric.rawValue / denom));
      const contribution = metric.direction === "positive" ? norm : 1 - norm;
      score += contribution * metric.weight;
    }
    score = (score / totalWeight) * 100;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  static getStatusTier(score: number): HealthStatus {
    if (score >= 71) return "Healthy";
    if (score >= 31) return "At-Risk";
    return "Critical";
  }
}
