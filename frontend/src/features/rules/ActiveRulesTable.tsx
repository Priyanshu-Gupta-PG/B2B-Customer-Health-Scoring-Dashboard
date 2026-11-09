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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border backdrop-blur-sm",
        direction === "positive"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border-rose-500/20 bg-rose-500/10 text-rose-300",
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
        <thead className="border-b border-white/[0.06] bg-white/[0.02] text-text-muted text-[11px] tracking-wider uppercase">
          <tr>
            <th className="px-5 py-3.5 font-medium">Telemetry Signal</th>
            <th className="px-5 py-3.5 font-medium">Engine Weight</th>
            <th className="px-5 py-3.5 font-medium">Impact Vector</th>
            <th className="px-5 py-3.5 font-medium">Threshold</th>
            <th className="px-5 py-3.5 font-medium">Last Modified</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {active.map((rule) => (
            <tr key={rule.id} className="transition-colors hover:bg-white/[0.02]">
              <td className="px-5 py-4">
                <p className="text-text font-semibold">{metricLabel(rule.metric_name)}</p>
                <p className="text-text-muted mt-0.5 font-mono text-[11px]">{rule.metric_name}</p>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="num text-text font-semibold w-10 text-right">{rule.weight_percentage}%</span>
                  <div
                    className="h-2 w-32 overflow-hidden rounded-full bg-white/[0.06]"
                    aria-hidden
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
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
                  <span className="font-semibold text-text">{rule.threshold}</span>
                )}
              </td>
              <td className="text-text-muted px-5 py-4 text-xs">{formatDateTime(rule.updated_at)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/[0.08] bg-white/[0.02]">
            <td className="text-text-muted px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" colSpan={1}>
              Composite Allocation Total
            </td>
            <td className="px-5 py-3.5" colSpan={4}>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold",
                  totalInvalid
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                )}
              >
                {!totalInvalid && <CheckCircle2 className="size-3.5 text-emerald-400" />}
                <span className="num font-bold">{total}%</span>
                {totalInvalid ? (
                  <span className="font-normal text-rose-300">{TOTAL_WEIGHT_ERROR}</span>
                ) : (
                  <span className="font-normal text-emerald-300/80">Valid: Ready for automated recalculation</span>
                )}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
