import type { MetricName, ScoringRule } from "@/types/api";
import { METRIC_META } from "./seed";

/**
 * Mirror of the backend ScoringCalculator (LLD-B2B-01 §2.1) so mock data behaves like
 * the real engine: weighted linear combination of normalised metrics, clamped to 0–100.
 *
 * positive metric  -> contributes  norm * weight
 * negative metric  -> contributes (1 - norm) * weight
 */
export function calculateScore(raw: Record<MetricName, number>, rules: ScoringRule[]): number {
  const active = rules.filter((r) => r.is_active);
  const totalWeight = active.reduce((sum, r) => sum + r.weight_percentage, 0);
  if (active.length === 0 || totalWeight === 0) return 100;

  let score = 0;
  for (const rule of active) {
    const meta = METRIC_META[rule.metric_name];
    const value = raw[rule.metric_name] ?? 0;
    const norm = Math.max(0, Math.min(1, value / meta.normaliseBy));
    const contribution = rule.impact_direction === "positive" ? norm : 1 - norm;
    score += contribution * rule.weight_percentage;
  }
  // Scale so a non-100 total (shouldn't happen – API validates) still maps to 0–100.
  score = (score / totalWeight) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}
