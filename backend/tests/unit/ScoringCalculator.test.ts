import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  METRIC_NORMALISERS,
  ScoringCalculator,
  type ScoringMetricInput,
} from "../../src/engine/ScoringCalculator.js";

function metric(
  partial: Partial<ScoringMetricInput> & Pick<ScoringMetricInput, "rawValue" | "weight" | "direction">,
): ScoringMetricInput {
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

  it("returns base score 100 when every weight is zero", () => {
    assert.equal(
      ScoringCalculator.calculate([
        metric({ rawValue: 5, weight: 0, direction: "negative", normaliseBy: 5 }),
        metric({ rawValue: 10, weight: 0, direction: "positive", normaliseBy: 60 }),
      ]),
      100,
    );
  });

  it("UT-SC-002 applies a negative deduction", () => {
    const score = ScoringCalculator.calculate([
      metric({
        metricType: "overdue_invoice",
        rawValue: 5,
        weight: 100,
        direction: "negative",
        normaliseBy: 10,
      }),
    ]);
    assert.equal(score, 50);
  });

  it("UT-SC-003 clamps the floor at 0", () => {
    const floored = ScoringCalculator.calculate([
      metric({ rawValue: 10_000, weight: 100, direction: "negative", normaliseBy: 1 }),
    ]);
    assert.equal(floored, 0);
  });

  it("UT-SC-004 clamps the ceiling at 100", () => {
    const score = ScoringCalculator.calculate([
      metric({ rawValue: 10_000, weight: 100, direction: "positive", normaliseBy: 1 }),
    ]);
    assert.equal(score, 100);
  });

  it("clamps normalised ratio when rawValue is negative", () => {
    const score = ScoringCalculator.calculate([
      metric({ rawValue: -20, weight: 100, direction: "positive", normaliseBy: 10 }),
    ]);
    assert.equal(score, 0);
  });

  it("treats normaliseBy <= 0 as 1 so scoring never divides by zero", () => {
    const score = ScoringCalculator.calculate([
      metric({ rawValue: 0.5, weight: 100, direction: "positive", normaliseBy: 0 }),
    ]);
    assert.equal(score, 50);
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
      {
        metricType: "product_usage",
        rawValue: 60,
        weight: 40,
        direction: "positive",
        normaliseBy: METRIC_NORMALISERS.product_usage,
      },
      {
        metricType: "support_tickets",
        rawValue: 0,
        weight: 30,
        direction: "negative",
        normaliseBy: METRIC_NORMALISERS.support_tickets,
      },
      {
        metricType: "overdue_invoice",
        rawValue: 0,
        weight: 30,
        direction: "negative",
        normaliseBy: METRIC_NORMALISERS.overdue_invoice,
      },
    ]);
    assert.equal(score, 100);
  });

  it("applies PRD-style weights (usage 40 / tickets 30 / invoices 30)", () => {
    // usage 30/60=0.5 → 0.5*40; tickets 5/10=0.5 → (1-0.5)*30; invoices 1/5=0.2 → (1-0.2)*30
    // = 20 + 15 + 24 = 59
    const score = ScoringCalculator.calculate([
      {
        metricType: "product_usage",
        rawValue: 30,
        weight: 40,
        direction: "positive",
        normaliseBy: 60,
      },
      {
        metricType: "support_tickets",
        rawValue: 5,
        weight: 30,
        direction: "negative",
        normaliseBy: 10,
      },
      {
        metricType: "overdue_invoice",
        rawValue: 1,
        weight: 30,
        direction: "negative",
        normaliseBy: 5,
      },
    ]);
    assert.equal(score, 59);
  });

  it("ignores zero-weight metrics when mixing with active weights", () => {
    const score = ScoringCalculator.calculate([
      metric({ rawValue: 0, weight: 100, direction: "positive", normaliseBy: 10 }),
      metric({ rawValue: 100, weight: 0, direction: "positive", normaliseBy: 10 }),
    ]);
    assert.equal(score, 0);
  });

  it("rounds to the nearest integer score", () => {
    // raw 1 / 3 ≈ 0.333… * 100 = 33.333… → 33
    const score = ScoringCalculator.calculate([
      metric({ rawValue: 1, weight: 100, direction: "positive", normaliseBy: 3 }),
    ]);
    assert.equal(score, 33);
  });

  it("exposes default normalisers for the three MVP metrics", () => {
    assert.equal(METRIC_NORMALISERS.product_usage, 60);
    assert.equal(METRIC_NORMALISERS.support_tickets, 10);
    assert.equal(METRIC_NORMALISERS.overdue_invoice, 5);
  });
});
