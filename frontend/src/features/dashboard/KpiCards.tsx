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
    critical > 0
      ? "text-rose-400"
      : summary.at_risk_accounts > 0
        ? "text-amber-400"
        : "text-emerald-400";

  return (
    <section
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", highlight && "data-refreshed")}
      aria-label="Portfolio KPIs"
    >
      <KpiCard
        href="/accounts"
        label="Total accounts"
        value={formatNumber(summary.total_accounts)}
        hint="Under active CS telemetry"
        icon={<Building2 className="text-blue-400 size-4" aria-hidden />}
        glowClass="ambient-glow-indigo"
      >
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-blue-400" />
            Portfolio synced
          </span>
          <span className="font-mono text-[11px] text-text-subtle">Live</span>
        </div>
      </KpiCard>

      <KpiCard
        href="/accounts?status=Critical"
        label="Accounts at risk"
        value={formatNumber(summary.at_risk_accounts)}
        valueClassName={atRiskClass}
        hint={`${formatNumber(critical)} critical · ${formatNumber(atRiskOnly)} at-risk`}
        icon={<AlertTriangle className={cn("size-4", atRiskClass)} aria-hidden />}
        glowClass="ambient-glow-amber"
      >
        <div className="mt-3.5 space-y-1.5 border-t border-white/[0.06] pt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised flex">
            <div
              className="h-full bg-rose-500 transition-all duration-700 ease-out"
              style={{ width: `${(critical / total) * 100}%` }}
              title={`Critical: ${critical}`}
            />
            <div
              className="h-full bg-amber-400 transition-all duration-700 ease-out"
              style={{ width: `${(atRiskOnly / total) * 100}%` }}
              title={`At-Risk: ${atRiskOnly}`}
            />
            <div
              className="h-full bg-emerald-500/30 transition-all duration-700 ease-out flex-1"
              title={`Healthy: ${healthy}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-muted font-mono">
            <span>Critical: {Math.round((critical / total) * 100)}%</span>
            <span>Healthy: {Math.round((healthy / total) * 100)}%</span>
          </div>
        </div>
      </KpiCard>

      <KpiCard
        label="Avg portfolio health"
        value={summary.average_score.toFixed(1)}
        valueClassName={scoreTextClass(summary.average_score)}
        hint="Composite score 0–100"
        icon={<Activity className="text-emerald-400 size-4" aria-hidden />}
        glowClass="ambient-glow-emerald"
      >
        <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <StatusBadge score={summary.average_score} size="sm" />
          <span className="text-[11px] text-text-muted font-mono">
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
        label="Last data sync"
        value={formatRelative(summary.last_sync_at)}
        hint={
          summary.last_sync_at
            ? formatDateTime(summary.last_sync_at)
            : "Waiting for first ingestion"
        }
        icon={<RefreshCw className="text-text-muted size-4" aria-hidden />}
      >
        <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <CronStatusIndicator />
          <span className="text-[11px] text-text-subtle font-mono">Every 15m</span>
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
  glowClass,
  children,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  valueClassName?: string;
  glowClass?: string;
  children?: ReactNode;
  href?: string;
}) {
  const body = (
    <Card
      hoverable={Boolean(href)}
      className={cn("group relative p-5 transition-all duration-300 h-full", href && "cursor-pointer")}
    >
      {glowClass && (
        <div
          className={cn(
            "pointer-events-none absolute -top-10 -right-10 size-32 rounded-full opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
            glowClass,
          )}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <p className="text-text-muted text-[11px] leading-snug font-semibold tracking-wider uppercase">
            {label}
          </p>
          <div className="flex size-7 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] shadow-sm">
            {icon}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <p className={cn("num text-text text-3xl font-semibold tracking-tight transition-colors", valueClassName)}>
            {value}
          </p>
        </div>

        {hint && <p className="text-text-muted mt-1 text-xs truncate">{hint}</p>}
        {children}
      </div>
    </Card>
  );

  if (!href) return body;
  return (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-card">
      {body}
    </Link>
  );
}
