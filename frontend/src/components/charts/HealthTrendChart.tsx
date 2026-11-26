"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryPoint } from "@/types/api";
import { STATUS_COLOR, getStatusTier } from "@/lib/status";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";

/** PRD US-004: last 30 / 60 / 90 days of score changes. */
export const HISTORY_RANGES = [30, 60, 90] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

const RANGE_LABEL: Record<HistoryRange, string> = {
  30: "30 days",
  60: "60 days",
  90: "90 days",
};

export function HealthTrendChart({
  data,
  days,
  onDaysChange,
  isLoading = false,
  isError = false,
  onRetry,
}: {
  data: HistoryPoint[];
  days: HistoryRange;
  onDaysChange: (days: HistoryRange) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  const latest = data.at(-1)?.score ?? 0;
  const stroke = STATUS_COLOR[getStatusTier(latest)];

  return (
    <Card className="flex min-h-[22rem] flex-col animate-fade-in-up stagger-1">
      <CardHeader
        title="Historical Health Trajectory"
        description="Daily snapshot snapshots of the composite 0–100 health score"
        action={<RangeToggle days={days} onDaysChange={onDaysChange} disabled={isLoading && data.length === 0} />}
      />
      <CardBody className="flex flex-1 flex-col">
        {isError ? (
          <ErrorState title="Failed to load history" onRetry={onRetry} className="py-10" />
        ) : isLoading && data.length === 0 ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length === 0 ? (
          <EmptyState title="No historical score snapshots recorded yet." className="py-10" />
        ) : (
          <div className={cn("h-72 w-full pt-2", isLoading && "opacity-60")}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stroke} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={stroke} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  tick={{ fill: "#949ca8", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.07)" }}
                  tickLine={false}
                  minTickGap={days === 30 ? 16 : 24}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 30, 70, 100]}
                  tick={{ fill: "#949ca8", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ScoreTooltip />} cursor={{ stroke: "rgba(255, 255, 255, 0.15)", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Health score"
                  stroke={stroke}
                  strokeWidth={2.5}
                  fill="url(#scoreAreaGradient)"
                  dot={days === 30 ? { r: 2, fill: stroke } : false}
                  activeDot={{ r: 5, fill: stroke, stroke: "#11141a", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function RangeToggle({
  days,
  onDaysChange,
  disabled,
}: {
  days: HistoryRange;
  onDaysChange: (days: HistoryRange) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5" role="group" aria-label="History range">
      {HISTORY_RANGES.map((range) => {
        const active = range === days;
        return (
          <button
            key={range}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onDaysChange(range)}
            className={cn(
              "h-7 rounded-md px-2.5 text-xs font-medium transition-all duration-150 disabled:opacity-40 cursor-pointer select-none",
              active
                ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.08]"
                : "text-text-muted hover:text-text hover:bg-white/[0.04]",
            )}
          >
            {RANGE_LABEL[range]}
          </button>
        );
      })}
    </div>
  );
}

function formatAxisDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ScoreTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const score = payload[0]?.value ?? 0;
  return (
    <div className="card-premium rounded-xl px-3.5 py-2.5 text-xs shadow-xl border border-white/10 backdrop-blur-md">
      <p className="text-text-muted text-[11px]">{formatAxisDate(label)}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="num text-base font-bold text-white">{score}</span>
        <StatusBadge score={score} size="sm" />
      </div>
    </div>
  );
}
