"use client";

import type { ReactNode } from "react";
import Link from "next/link";
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
  const atRiskOnly = summary.distribution["At-Risk"] ?? 0;
  const critical = summary.critical_accounts ?? 0;
  const healthy = summary.distribution["Healthy"] ?? 0;
  const total = summary.total_accounts || 1;

  const atRiskClass =
    critical > 0 ? "text-danger" : summary.at_risk_accounts > 0 ? "text-warning" : "text-success";

  return (
    <section
      className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", highlight && "data-refreshed")}
      aria-label="Portfolio KPIs"
    >
      <KpiCard
        href="/accounts"
        label="Total accounts"
        value={formatNumber(summary.total_accounts)}
        hint="Active in portfolio"
        icon={<Building2 className="text-primary size-4" aria-hidden />}
      >
        <div className="border-border text-text-muted mt-3 flex items-center justify-between gap-2 border-t pt-2.5 text-xs">
          <span>Fully scored</span>
          <span className="text-text-subtle font-mono text-[11px]">Live</span>
        </div>
      </KpiCard>

      <KpiCard
        href="/accounts?status=Critical"
        label="Accounts at risk"
        value={formatNumber(summary.at_risk_accounts)}
        valueClassName={atRiskClass}
        hint={`${formatNumber(critical)} critical · ${formatNumber(atRiskOnly)} at-risk`}
        icon={<AlertTriangle className={cn("size-4", atRiskClass)} aria-hidden />}
      >
        <div className="border-border mt-3 space-y-1.5 border-t pt-2.5">
          <div className="bg-surface-elevated flex h-1.5 w-full overflow-hidden rounded-sm">
            <div
              className="bg-danger h-full transition-all duration-500"
              style={{ width: `${(critical / total) * 100}%` }}
              title={`Critical: ${critical}`}
            />
            <div
              className="bg-warning h-full transition-all duration-500"
              style={{ width: `${(atRiskOnly / total) * 100}%` }}
              title={`At-Risk: ${atRiskOnly}`}
            />
            <div
              className="bg-success/35 h-full flex-1 transition-all duration-500"
              title={`Healthy: ${healthy}`}
            />
          </div>
          <div className="text-text-muted flex justify-between font-mono text-[10px]">
            <span>Critical {Math.round((critical / total) * 100)}%</span>
            <span>Healthy {Math.round((healthy / total) * 100)}%</span>
          </div>
        </div>
      </KpiCard>

      <KpiCard
        label="Avg health score"
        value={summary.average_score.toFixed(1)}
        valueClassName={scoreTextClass(summary.average_score)}
        hint="Composite 0–100"
        icon={<Activity className="text-success size-4" aria-hidden />}
      >
        <div className="border-border mt-3 flex items-center justify-between border-t pt-2.5">
          <StatusBadge score={summary.average_score} size="sm" />
          <span className="text-text-muted text-[11px]">
            {summary.average_score >= 71
              ? "On track"
              : summary.average_score >= 31
                ? "Needs attention"
                : "Action needed"}
          </span>
        </div>
      </KpiCard>

      <KpiCard
        href="/settings"
        label="Last sync"
        value={formatRelative(summary.last_sync_at)}
        hint={
          summary.last_sync_at
            ? formatDateTime(summary.last_sync_at)
            : "Waiting for first ingestion"
        }
        icon={<RefreshCw className="text-text-muted size-4" aria-hidden />}
      >
        <div className="border-border mt-3 flex items-center justify-between border-t pt-2.5">
          <CronStatusIndicator />
          <span className="text-text-subtle font-mono text-[11px]">Every 15m</span>
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
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  valueClassName?: string;
  children?: ReactNode;
  href?: string;
}) {
  const body = (
    <Card hoverable={Boolean(href)} className={cn("h-full p-4", href && "cursor-pointer")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-text-muted text-[11px] font-semibold tracking-wide uppercase">{label}</p>
        <div className="border-border bg-surface-raised flex size-7 items-center justify-center rounded-md border">
          {icon}
        </div>
      </div>

      <p className={cn("num text-text mt-2 text-2xl font-semibold tracking-tight", valueClassName)}>
        {value}
      </p>
      {hint && <p className="text-text-muted mt-1 truncate text-xs">{hint}</p>}
      {children}
    </Card>
  );

  if (!href) return body;
  return (
    <Link
      href={href}
      className="focus-visible:ring-primary/35 block rounded-[var(--radius-card)] focus-visible:ring-2 focus-visible:outline-none"
    >
      {body}
    </Link>
  );
}
