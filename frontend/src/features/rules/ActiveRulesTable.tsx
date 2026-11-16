import { ArrowDownRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import type { ImpactDirection, ScoringRule } from "@/types/api";
import { formatDateTime, metricLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { TOTAL_WEIGHT_ERROR, activeWeightTotal } from "./schema";

const IMPACT_COPY: Record<ImpactDirection, { label: string; hint: string }> = {
  positive: { label: "Positive Impact", hint: "Higher values increase health score" },
  negative: { label: "Negative Impact", hint: "Higher values decrease health score" },
};

function ImpactBadge({ direction }: { direction: ImpactDirection }) {
  const copy = IMPACT_COPY[direction];
  const Icon = direction === "positive" ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      title={copy.hint}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm",
        direction === "positive"
          ? "border-success/25 bg-success-subtle text-success"
          : "border-danger/25 bg-danger-subtle text-danger",
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
        description="Activate at least one telemetry metric and maintain active weights totaling exactly 100%."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-border bg-surface-raised text-text-muted border-b text-[11px] tracking-wider uppercase">
          <tr>
            <th className="px-5 py-3.5 font-medium">Telemetry Signal</th>
            <th className="px-5 py-3.5 font-medium">Engine Weight</th>
            <th className="px-5 py-3.5 font-medium">Impact Vector</th>
            <th className="px-5 py-3.5 font-medium">Threshold</th>
            <th className="px-5 py-3.5 font-medium">Last Modified</th>
          </tr>
        </thead>
        <tbody className="divide-border-subtle divide-y">
          {active.map((rule) => (
            <tr key={rule.id} className="hover:bg-surface-raised transition-colors">
              <td className="px-5 py-4">
                <p className="text-text font-semibold">{metricLabel(rule.metric_name)}</p>
                <p className="text-text-muted mt-0.5 font-mono text-[11px]">{rule.metric_name}</p>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="num text-text w-10 text-right font-semibold">
                    {rule.weight_percentage}%
                  </span>
                  <div
                    className="bg-surface-raised h-2 w-32 overflow-hidden rounded-full"
                    aria-hidden
                  >
                    <div
                      className="bg-primary h-full rounded-sm transition-all duration-500"
                      style={{ width: `${rule.weight_percentage}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <ImpactBadge direction={rule.impact_direction} />
              </td>
              <td className="num text-text-muted px-5 py-4">
                {rule.threshold == null ? (
                  <span className="text-text-subtle">Normalized</span>
                ) : (
                  <span className="text-text font-semibold">{rule.threshold}</span>
                )}
              </td>
              <td className="text-text-muted px-5 py-4 text-xs">
                {formatDateTime(rule.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-border bg-surface-raised border-t">
            <td
              className="text-text-muted px-5 py-3.5 text-xs font-semibold tracking-wider uppercase"
              colSpan={1}
            >
              Composite Allocation Total
            </td>
            <td className="px-5 py-3.5" colSpan={4}>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold",
                  totalInvalid
                    ? "border-danger/30 bg-danger-subtle text-danger"
                    : "border-success/30 bg-success-subtle text-success",
                )}
              >
                {!totalInvalid && <CheckCircle2 className="text-success size-3.5" />}
                <span className="num font-bold">{total}%</span>
                {totalInvalid ? (
                  <span className="text-danger font-normal">{TOTAL_WEIGHT_ERROR}</span>
                ) : (
                  <span className="text-success/80 font-normal">
                    Valid: Ready for automated recalculation
                  </span>
                )}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
