import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ImpactDirection, ScoringRule } from "@/types/api";
import { formatDateTime, metricLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { TOTAL_WEIGHT_ERROR, activeWeightTotal } from "./schema";

const IMPACT_COPY: Record<ImpactDirection, { label: string; hint: string }> = {
  positive: { label: "Positive", hint: "Higher value raises the score" },
  negative: { label: "Negative", hint: "Higher value lowers the score" },
};

function ImpactBadge({ direction }: { direction: ImpactDirection }) {
  const copy = IMPACT_COPY[direction];
  const Icon = direction === "positive" ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      title={copy.hint}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        direction === "positive"
          ? "bg-success/15 text-success ring-success/30"
          : "bg-danger/15 text-danger ring-danger/30",
      )}
    >
      <Icon className="size-3" aria-hidden />
      {copy.label}
    </span>
  );
}

export function ActiveRulesTable({
  rules,
  loading = false,
}: {
  rules: ScoringRule[];
  loading?: boolean;
}) {
  const active = rules.filter((rule) => rule.is_active);
  const total = activeWeightTotal(active);
  const totalInvalid = total !== 100;

  if (loading) {
    return (
      <div className="px-2 py-2">
        <TableSkeleton rows={3} cols={5} />
      </div>
    );
  }

  if (active.length === 0) {
    return (
      <EmptyState
        title="No active scoring rules"
        description="Activate at least one metric and keep active weights at exactly 100%."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-border bg-bg/40 text-text-muted border-b text-[11px] tracking-wide uppercase">
          <tr>
            <th className="px-5 py-3 font-medium">Metric</th>
            <th className="px-5 py-3 font-medium">Weight</th>
            <th className="px-5 py-3 font-medium">Impact</th>
            <th className="px-5 py-3 font-medium">Threshold</th>
            <th className="px-5 py-3 font-medium">Last updated</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {active.map((rule) => (
            <tr key={rule.id}>
              <td className="px-5 py-3.5">
                <p className="text-text font-medium">{metricLabel(rule.metric_name)}</p>
                <p className="text-text-muted mt-0.5 font-mono text-[11px]">{rule.metric_name}</p>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="num text-text w-10 text-right">{rule.weight_percentage}%</span>
                  <div
                    className="bg-surface-raised h-1.5 w-24 overflow-hidden rounded-full"
                    aria-hidden
                  >
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${rule.weight_percentage}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <ImpactBadge direction={rule.impact_direction} />
              </td>
              <td className="num text-text-muted px-5 py-3.5">
                {rule.threshold == null ? "—" : rule.threshold}
              </td>
              <td className="text-text-muted px-5 py-3.5">{formatDateTime(rule.updated_at)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-border border-t">
            <td className="text-text-muted px-5 py-3 text-xs font-medium" colSpan={1}>
              Active total
            </td>
            <td className="px-5 py-3" colSpan={4}>
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium",
                  totalInvalid
                    ? "border-danger bg-danger/10 text-danger"
                    : "border-success/30 bg-success/10 text-success",
                )}
              >
                <span className="num">{total}%</span>
                {totalInvalid && <span className="ml-2 font-normal">{TOTAL_WEIGHT_ERROR}</span>}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
