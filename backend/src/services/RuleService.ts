import { prisma } from "../infrastructure/prisma.js";
import { recalculateAll } from "../engine/RecalculationService.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { AuthUser } from "../middleware/auth.js";
import { writeAudit } from "./AuditService.js";

function toRule(row: {
  id: string;
  metricName: string;
  weightPercentage: number;
  impactDirection: string;
  threshold: number | null;
  isActive: boolean;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    metric_name: row.metricName,
    weight_percentage: row.weightPercentage,
    impact_direction: row.impactDirection,
    threshold: row.threshold,
    is_active: row.isActive,
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function listRules() {
  const rows = await prisma.scoringRule.findMany({ orderBy: { metricName: "asc" } });
  return { data: rows.map(toRule) };
}

function validateTotal(rules: Array<{ isActive: boolean; weightPercentage: number; metricName: string }>) {
  for (const r of rules) {
    if (!Number.isInteger(r.weightPercentage) || r.weightPercentage < 0 || r.weightPercentage > 100) {
      throw new HttpError(
        422,
        "Validation Error",
        `weight_percentage for ${r.metricName} must be an integer between 0 and 100.`,
      );
    }
  }
  const total = rules.filter((r) => r.isActive).reduce((s, r) => s + r.weightPercentage, 0);
  if (total !== 100) {
    throw new HttpError(
      422,
      "Validation Error",
      `The sum of all active scoring metric weights must equal exactly 100 (got ${total}).`,
    );
  }
}

export async function updateRule(
  id: string,
  patch: { weight_percentage?: number; impact_direction?: string; threshold?: number | null; is_active?: boolean },
  actor: AuthUser,
) {
  const existing = await prisma.scoringRule.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Not Found", "Rule not found.");

  const all = await prisma.scoringRule.findMany();
  const candidate = all.map((r) =>
    r.id === id
      ? {
          ...r,
          weightPercentage: patch.weight_percentage ?? r.weightPercentage,
          impactDirection: patch.impact_direction ?? r.impactDirection,
          threshold: patch.threshold === undefined ? r.threshold : patch.threshold,
          isActive: patch.is_active ?? r.isActive,
        }
      : r,
  );
  validateTotal(candidate);

  const rule = await prisma.scoringRule.update({
    where: { id },
    data: {
      weightPercentage: patch.weight_percentage ?? existing.weightPercentage,
      impactDirection: patch.impact_direction ?? existing.impactDirection,
      threshold: patch.threshold === undefined ? existing.threshold : patch.threshold,
      isActive: patch.is_active ?? existing.isActive,
    },
  });

  const result = await recalculateAll();
  await writeAudit(actor, "RULE_UPDATED", existing.metricName, { weight_percentage: existing.weightPercentage }, {
    weight_percentage: rule.weightPercentage,
  });
  await writeAudit(actor, "RECALCULATION_RUN", null, null, {
    accounts_recalculated: result.accounts,
    duration_ms: result.durationMs,
  });

  return {
    message: "Rule updated successfully. Batch recalculation triggered.",
    rule: toRule(rule),
  };
}

export async function bulkUpdateRules(
  patches: Array<{ id: string; weight_percentage?: number; impact_direction?: string; threshold?: number | null; is_active?: boolean }>,
  actor: AuthUser,
) {
  const all = await prisma.scoringRule.findMany();
  const byId = new Map(patches.map((p) => [p.id, p]));
  for (const id of byId.keys()) {
    if (!all.some((r) => r.id === id)) {
      throw new HttpError(422, "Validation Error", `Unknown rule id ${id}`);
    }
  }

  const candidate = all.map((r) => {
    const patch = byId.get(r.id);
    if (!patch) return r;
    return {
      ...r,
      weightPercentage: patch.weight_percentage ?? r.weightPercentage,
      impactDirection: patch.impact_direction ?? r.impactDirection,
      threshold: patch.threshold === undefined ? r.threshold : patch.threshold,
      isActive: patch.is_active ?? r.isActive,
    };
  });
  validateTotal(candidate);

  const prior: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};

  await prisma.$transaction(
    candidate
      .filter((r) => byId.has(r.id))
      .map((r) =>
        prisma.scoringRule.update({
          where: { id: r.id },
          data: {
            weightPercentage: r.weightPercentage,
            impactDirection: r.impactDirection,
            threshold: r.threshold,
            isActive: r.isActive,
          },
        }),
      ),
  );

  for (const r of candidate) {
    const original = all.find((o) => o.id === r.id)!;
    if (original.weightPercentage !== r.weightPercentage) {
      prior[r.metricName] = { weight_percentage: original.weightPercentage };
      after[r.metricName] = { weight_percentage: r.weightPercentage };
    }
  }

  const result = await recalculateAll();
  if (Object.keys(after).length) {
    await writeAudit(actor, "RULES_BULK_UPDATED", null, prior, after);
  }
  await writeAudit(actor, "RECALCULATION_RUN", null, null, {
    accounts_recalculated: result.accounts,
    duration_ms: result.durationMs,
  });

  const rules = await prisma.scoringRule.findMany({ orderBy: { metricName: "asc" } });
  return {
    message: "Rules updated successfully. Batch recalculation complete.",
    rules: rules.map(toRule),
    accounts_recalculated: result.accounts,
    duration_ms: result.durationMs,
  };
}
