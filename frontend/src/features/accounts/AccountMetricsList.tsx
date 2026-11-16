"use client";

import { CreditCard, HardDrive, HelpCircle, Layers, Radio } from "lucide-react";
import type { AccountMetric, MetricName, ScoringRule, SourceApi } from "@/types/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";

const SOURCE_META: Record<
  SourceApi,
  { label: string; icon: typeof HardDrive; color: string; badge: string }
> = {
  stripe: {
    label: "Stripe Billing",
    icon: CreditCard,
    color: "text-primary",
    badge: "border-primary/25 bg-primary-subtle text-primary",
  },
  zendesk: {
    label: "Zendesk Support",
    icon: HelpCircle,
    color: "text-warning",
    badge: "border-warning/25 bg-warning-subtle text-warning",
  },
  product: {
    label: "Product Telemetry",
    icon: HardDrive,
    color: "text-success",
    badge: "border-success/25 bg-success-subtle text-success",
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
  const points = ((positiveShare * rule.weight_percentage) / 100) * 100;
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
    <Card className="">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Radio className="text-primary size-4" />
            Signal contribution
          </span>
        }
        description="Raw telemetry and estimated points toward the composite score"
      />
      {metrics.length === 0 ? (
        <EmptyState title="No raw metrics available for this account." className="py-10" />
      ) : (
        <CardBody className="p-0">
          <ul className="divide-border-subtle divide-y">
            {metrics.map((metric) => {
              const meta = SOURCE_META[metric.source_api] ?? {
                label: metric.source_api,
                icon: Layers,
                color: "text-text-muted",
                badge: "border-border bg-white/5 text-text-muted",
              };
              const Icon = meta.icon;
              const contribution = metricContribution(metric, rules);
              const barTone =
                contribution == null
                  ? "bg-blue-400"
                  : contribution.healthPct >= 71
                    ? "bg-success"
                    : contribution.healthPct >= 31
                      ? "bg-warning"
                      : "bg-danger";

              return (
                <li
                  key={metric.id}
                  className="hover:bg-surface-raised flex flex-col gap-3 px-5 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="bg-surface-raised border-border flex size-9 shrink-0 items-center justify-center rounded-xl border">
                      <Icon className={`size-4 ${meta.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-text text-sm font-semibold">{metric.label}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-text-muted mt-1 text-xs">
                        Recorded {formatDateTime(metric.recorded_at)}
                        {contribution ? (
                          <>
                            {" "}
                            · Weight {contribution.weight}% ·{" "}
                            {contribution.direction === "positive"
                              ? "Higher is better"
                              : "Lower is better"}
                          </>
                        ) : null}
                      </p>
                      {contribution ? (
                        <div className="mt-2.5 max-w-sm">
                          <div className="text-text-muted mb-1 flex items-center justify-between text-[10px]">
                            <span>Signal health</span>
                            <span className="num">{contribution.healthPct}%</span>
                          </div>
                          <div className="bg-surface-raised h-1.5 overflow-hidden rounded-full">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                barTone,
                              )}
                              style={{ width: `${contribution.healthPct}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-end gap-4 self-start pl-12 sm:self-center sm:pl-0">
                    {contribution ? (
                      <div className="text-right">
                        <p className="text-text-muted text-[10px] tracking-wider uppercase">
                          Est. points
                        </p>
                        <p className="num text-text text-sm font-semibold">{contribution.points}</p>
                      </div>
                    ) : null}
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-2">
                        <span className="num text-text text-xl font-bold tracking-tight">
                          {formatNumber(metric.metric_value)}
                        </span>
                        <span className="text-text-muted text-xs font-medium tracking-wider uppercase">
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
