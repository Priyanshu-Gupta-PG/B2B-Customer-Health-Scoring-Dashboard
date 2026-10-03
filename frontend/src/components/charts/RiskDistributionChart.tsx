"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { STATUS_COLOR } from "@/lib/status";
import type { HealthStatus } from "@/types/api";

/** Donut order matches the UX spec: Green / Yellow / Red. */
const TIER_ORDER: HealthStatus[] = ["Healthy", "At-Risk", "Critical"];

type Slice = {
  name: HealthStatus;
  value: number;
  fill: string;
};

function RiskTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: Slice }>;
}) {
  if (!active || !payload?.length) return null;
  const slice = payload[0];
  return (
    <div className="border-border bg-surface rounded-md border px-3 py-2 text-xs shadow-lg shadow-black/30">
      <p className="text-text font-medium">{slice.name}</p>
      <p className="num text-text-muted mt-0.5">{formatNumber(slice.value ?? 0)} accounts</p>
    </div>
  );
}

export function RiskDistributionChart({
  distribution,
  className,
}: {
  distribution: Record<HealthStatus, number>;
  className?: string;
}) {
  const slices: Slice[] = TIER_ORDER.map((tier) => ({
    name: tier,
    value: distribution[tier] ?? 0,
    fill: STATUS_COLOR[tier],
  }));
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const pieData = slices.filter((slice) => slice.value > 0);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={pieData.length > 1 ? 3 : 0}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {pieData.map((slice) => (
                <Cell key={slice.name} fill={slice.fill} />
              ))}
            </Pie>
            <Tooltip content={<RiskTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-text text-2xl font-semibold">{formatNumber(total)}</span>
          <span className="text-text-muted text-[11px] tracking-wide uppercase">Accounts</span>
        </div>
      </div>

      <ul className="grid grid-cols-3 gap-2">
        {slices.map((slice) => {
          const pct = total === 0 ? 0 : Math.round((slice.value / total) * 100);
          return (
            <li key={slice.name} className="bg-bg/50 min-w-0 rounded-lg px-2 py-2 sm:px-2.5">
              <p className="text-text-muted flex items-center gap-1.5 text-[11px]">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.fill }}
                  aria-hidden
                />
                {slice.name}
              </p>
              <p className="num text-text mt-1 text-sm font-semibold">
                {formatNumber(slice.value)}
              </p>
              <p className="text-text-muted text-[11px]">{pct}%</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
