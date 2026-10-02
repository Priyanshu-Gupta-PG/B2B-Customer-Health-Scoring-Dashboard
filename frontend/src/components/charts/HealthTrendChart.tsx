"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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
import { cn } from "@/lib/cn";

export const HISTORY_RANGES = [7, 30, 90] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

const RANGE_LABEL: Record<HistoryRange, string> = {
  7: "7d",
  30: "30d",
  90: "90d",
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
    <Card className="flex min-h-[22rem] flex-col">
      <CardHeader
        title="Health trend"
        description="Daily snapshots of the composite 0–100 score."
        action={<RangeToggle days={days} onDaysChange={onDaysChange} disabled={isLoading && data.length === 0} />}
      />
      <CardBody className="flex flex-1 flex-col">
        {isError ? (
          <ErrorState title="Failed to load history" onRetry={onRetry} className="py-10" />
        ) : isLoading && data.length === 0 ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length === 0 ? (
          <EmptyState title="No historical data recorded for this client yet." className="py-10" />
        ) : (
          <div className={cn("h-64 w-full", isLoading && "opacity-60")}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                  minTickGap={days === 7 ? 8 : 24}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 30, 70, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  content={<ScoreTooltip />}
                  cursor={{ stroke: "#334155" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Health score"
                  stroke={stroke}
                  strokeWidth={2}
                  dot={days === 7}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
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
    <div className="inline-flex rounded-lg border border-border bg-bg p-0.5" role="group" aria-label="History range">
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
              "h-7 rounded-md px-2.5 text-xs font-medium transition-colors disabled:opacity-50",
              active ? "bg-primary/15 text-blue-300" : "text-text-muted hover:text-text",
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
  const score = payload[0]?.value;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="text-text-muted">{formatAxisDate(label)}</p>
      <p className="mt-0.5 text-text">
        Score <span className="num font-semibold">{score}</span>
      </p>
    </div>
  );
}
