import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ScoringCalculator, type ScoringMetricInput } from "../../src/engine/ScoringCalculator.js";

function metric(partial: Partial<ScoringMetricInput> & Pick<ScoringMetricInput, "rawValue" | "weight" | "direction">): ScoringMetricInput {
  return {
    metricType: partial.metricType ?? "overdue_invoice",
    normaliseBy: partial.normaliseBy ?? 1,
    ...partial,
  };
}

describe("ScoringCalculator", () => {
  it("UT-SC-001 returns base score 100 for an empty metric list", () => {
    assert.equal(ScoringCalculator.calculate([]), 100);
  });

  it("UT-SC-002 applies a negative deduction", () => {
    // 5 overdue invoices, normaliseBy 1, weight 10 each equivalent: 5 items * 10 = 50 deduction from 100
    // Using one metric: raw 5 / 10 = 0.5, negative => 0.5 * 100 weight = 50
    const score = ScoringCalculator.calculate([
      metric({ metricType: "overdue_invoice", rawValue: 5, weight: 100, direction: "negative", normaliseBy: 10 }),
    ]);
    assert.equal(score, 50);
  });

  it("UT-SC-003 clamps the floor at 0", () => {
    const score = ScoringCalculator.calculate([
      metric({ rawValue: 10_000, weight: 100, direction: "positive", normaliseBy: 1 }),
    ]);
    // This is a ceiling case; force a massive negative:
    const floored = ScoringCalculator.calculate([
      metric({ rawValue: 10_000, weight: 100, direction: "negative", normaliseBy: 1 }),
    ]);
    assert.equal(floored, 0);
    assert.ok(score <= 100);
  });

  it("UT-SC-004 clamps the ceiling at 100", () => {
    const score = ScoringCalculator.calculate([
      metric({ rawValue: 10_000, weight: 100, direction: "positive", normaliseBy: 1 }),
    ]);
    assert.equal(score, 100);
  });

  it("UT-SC-005 maps tier boundaries", () => {
    assert.equal(ScoringCalculator.getStatusTier(0), "Critical");
    assert.equal(ScoringCalculator.getStatusTier(30), "Critical");
    assert.equal(ScoringCalculator.getStatusTier(31), "At-Risk");
    assert.equal(ScoringCalculator.getStatusTier(35), "At-Risk");
    assert.equal(ScoringCalculator.getStatusTier(70), "At-Risk");
    assert.equal(ScoringCalculator.getStatusTier(71), "Healthy");
    assert.equal(ScoringCalculator.getStatusTier(100), "Healthy");
  });

  it("combines usage, tickets, and invoices like the dashboard mock", () => {
    const score = ScoringCalculator.calculate([
      { metricType: "product_usage", rawValue: 60, weight: 40, direction: "positive", normaliseBy: 60 },
      { metricType: "support_tickets", rawValue: 0, weight: 30, direction: "negative", normaliseBy: 10 },
      { metricType: "overdue_invoice", rawValue: 0, weight: 30, direction: "negative", normaliseBy: 5 },
    ]);
    assert.equal(score, 100);
  });
});
