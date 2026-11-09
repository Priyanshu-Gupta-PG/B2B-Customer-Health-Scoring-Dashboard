"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { HealthStatus } from "@/types/api";

/** Donut order matches the UX spec: Green / Yellow / Red. */
const TIER_ORDER: HealthStatus[] = ["Healthy", "At-Risk", "Critical"];

/* Refined human palette: not harsh neon, but organic & warm */
const REFINED_COLORS: Record<HealthStatus, string> = {
  Healthy: "#10b981", // Warm sage emerald
  "At-Risk": "#f59e0b", // Warm honey amber
  Critical: "#f43f5e", // Rose coral
};

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
    <div className="card-premium rounded-xl px-3.5 py-2.5 text-xs shadow-xl border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: slice.payload?.fill }} />
        <p className="text-text font-medium">{slice.name}</p>
      </div>
      <p className="num text-text-muted mt-1 text-[13px] font-semibold">
        {formatNumber(slice.value ?? 0)} accounts
      </p>
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
    fill: REFINED_COLORS[tier],
  }));
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const pieData = slices.filter((slice) => slice.value > 0);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="relative h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="92%"
              paddingAngle={pieData.length > 1 ? 4 : 0}
              cornerRadius={4}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {pieData.map((slice) => (
                <Cell key={slice.name} fill={slice.fill} />
              ))}
            </Pie>
            <Tooltip content={<RiskTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center callout */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-text text-3xl font-bold tracking-tight">{formatNumber(total)}</span>
          <span className="text-text-muted text-[10px] font-medium tracking-widest uppercase">Total Accounts</span>
        </div>
      </div>

      {/* Legend with interactive micro-bars */}
      <ul className="grid grid-cols-3 gap-2.5">
        {slices.map((slice) => {
          const pct = total === 0 ? 0 : Math.round((slice.value / total) * 100);
          return (
            <li
              key={slice.name}
              className="group relative rounded-xl border border-white/[0.06] bg-surface-raised/40 p-2.5 transition-all duration-200 hover:border-white/10 hover:bg-surface-raised"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted flex items-center gap-1.5 font-medium">
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.fill }}
                    aria-hidden
                  />
                  {slice.name}
                </span>
                <span className="num font-mono text-[10px] text-text-subtle">{pct}%</span>
              </div>
              <p className="num text-text mt-1.5 text-base font-semibold">
                {formatNumber(slice.value)}
              </p>
              {/* Progress track */}
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: slice.fill }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
