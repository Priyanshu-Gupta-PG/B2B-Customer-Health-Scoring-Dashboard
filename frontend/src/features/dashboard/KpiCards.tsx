import type { ReactNode } from "react";
import { Activity, AlertTriangle, Building2, RefreshCw } from "lucide-react";
import { CronStatusIndicator } from "@/components/system/CronStatusIndicator";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { scoreTextClass } from "@/lib/status";
import type { DashboardSummary } from "@/types/api";

export function KpiCards({
  summary,
  highlight = false,
}: {
  summary: DashboardSummary;
  highlight?: boolean;
}) {
  const atRiskOnly = summary.distribution["At-Risk"];
  const atRiskClass =
    summary.critical_accounts > 0
      ? "text-danger"
      : summary.at_risk_accounts > 0
        ? "text-warning"
        : "text-success";

  return (
    <section
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", highlight && "data-refreshed")}
      aria-label="Portfolio KPIs"
    >
      <KpiCard
        label="Total Active Accounts"
        value={formatNumber(summary.total_accounts)}
        hint="Accounts with a current health score"
        icon={<Building2 className="text-text-muted size-4" aria-hidden />}
      />
      <KpiCard
        label="Accounts at Risk"
        value={formatNumber(summary.at_risk_accounts)}
        valueClassName={atRiskClass}
        hint={`${formatNumber(summary.critical_accounts)} critical · ${formatNumber(atRiskOnly)} at-risk`}
        icon={<AlertTriangle className={cn("size-4", atRiskClass)} aria-hidden />}
      />
      <KpiCard
        label="Average Portfolio Health Score"
        value={summary.average_score.toFixed(1)}
        valueClassName={scoreTextClass(summary.average_score)}
        hint="Deterministic 0–100 score across the book"
        icon={<Activity className="text-text-muted size-4" aria-hidden />}
      >
        <div className="mt-3">
          <StatusBadge score={summary.average_score} size="sm" />
        </div>
      </KpiCard>
      <KpiCard
        label="Last Data Sync"
        value={formatRelative(summary.last_sync_at)}
        hint={
          summary.last_sync_at
            ? formatDateTime(summary.last_sync_at)
            : "Waiting for first ingestion"
        }
        icon={<RefreshCw className="text-text-muted size-4" aria-hidden />}
      >
        <div className="mt-3">
          <CronStatusIndicator />
        </div>
      </KpiCard>
    </section>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  valueClassName,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  valueClassName?: string;
  children?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-text-muted pr-2 text-xs leading-snug font-medium tracking-wide uppercase">
          {label}
        </p>
        {icon}
      </div>
      <p className={cn("num text-text mt-3 text-3xl font-semibold tracking-tight", valueClassName)}>
        {value}
      </p>
      {hint && <p className="text-text-muted mt-1 text-xs">{hint}</p>}
      {children}
    </Card>
  );
}
