"use client";

import { CreditCard, HardDrive, HelpCircle, Layers, Radio } from "lucide-react";
import type { AccountMetric, MetricName, ScoringRule, SourceApi } from "@/types/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";

const SOURCE_META: Record<SourceApi, { label: string; icon: typeof HardDrive; color: string; badge: string }> = {
  stripe: {
    label: "Stripe Billing",
    icon: CreditCard,
    color: "text-blue-400",
    badge: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  zendesk: {
    label: "Zendesk Support",
    icon: HelpCircle,
    color: "text-amber-400",
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
  product: {
    label: "Product Telemetry",
    icon: HardDrive,
    color: "text-emerald-400",
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
};

/** Same normalisers as the scoring engine / mock seed. */
const NORMALISE_BY: Record<MetricName, number> = {
  product_usage: 60,
  support_tickets: 10,
  overdue_invoice: 5,
};

function metricContribution(metric: AccountMetric, rules: ScoringRule[]) {
  const rule = rules.find((r) => r.metric_name === metric.metric_type && r.is_active);
  if (!rule) return null;
  const denom = NORMALISE_BY[metric.metric_type] || 1;
  const norm = Math.max(0, Math.min(1, metric.metric_value / denom));
  const positiveShare = rule.impact_direction === "positive" ? norm : 1 - norm;
  const points = (positiveShare * rule.weight_percentage) / 100 * 100;
  return {
    weight: rule.weight_percentage,
    direction: rule.impact_direction,
    points: Math.round(points * 10) / 10,
    healthPct: Math.round(positiveShare * 100),
  };
}

export function AccountMetricsList({
  metrics,
  rules = [],
}: {
  metrics: AccountMetric[];
  rules?: ScoringRule[];
}) {
  return (
    <Card className="animate-fade-in-up stagger-2">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Radio className="size-4 text-blue-400" />
            Signal contribution
          </span>
        }
        description="Raw telemetry and estimated points toward the composite score"
      />
      {metrics.length === 0 ? (
        <EmptyState title="No raw metrics available for this account." className="py-10" />
      ) : (
        <CardBody className="p-0">
          <ul className="divide-y divide-white/[0.04]">
            {metrics.map((metric) => {
              const meta = SOURCE_META[metric.source_api] ?? {
                label: metric.source_api,
                icon: Layers,
                color: "text-text-muted",
                badge: "border-white/10 bg-white/5 text-text-muted",
              };
              const Icon = meta.icon;
              const contribution = metricContribution(metric, rules);
              const barTone =
                contribution == null
                  ? "bg-blue-400"
                  : contribution.healthPct >= 71
                    ? "bg-emerald-500"
                    : contribution.healthPct >= 31
                      ? "bg-amber-400"
                      : "bg-rose-500";

              return (
                <li
                  key={metric.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-raised border border-white/[0.08]">
                      <Icon className={`size-4 ${meta.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-text">{metric.label}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        Recorded {formatDateTime(metric.recorded_at)}
                        {contribution ? (
                          <>
                            {" "}
                            · Weight {contribution.weight}% ·{" "}
                            {contribution.direction === "positive" ? "Higher is better" : "Lower is better"}
                          </>
                        ) : null}
                      </p>
                      {contribution ? (
                        <div className="mt-2.5 max-w-sm">
                          <div className="mb-1 flex items-center justify-between text-[10px] text-text-muted">
                            <span>Signal health</span>
                            <span className="num">{contribution.healthPct}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", barTone)}
                              style={{ width: `${contribution.healthPct}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-end gap-4 self-start sm:self-center pl-12 sm:pl-0 shrink-0">
                    {contribution ? (
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-text-muted">Est. points</p>
                        <p className="num text-sm font-semibold text-text">{contribution.points}</p>
                      </div>
                    ) : null}
                    <div className="text-right">
                      <div className="flex items-baseline gap-2 justify-end">
                        <span className="num text-xl font-bold tracking-tight text-text">
                          {formatNumber(metric.metric_value)}
                        </span>
                        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                          {metric.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardBody>
      )}
    </Card>
  );
}
