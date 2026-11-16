"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { STATUS_COLOR } from "@/lib/status";
import type { HealthStatus } from "@/types/api";

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
    <div className="panel rounded-md px-3 py-2 text-xs shadow-md">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-sm" style={{ backgroundColor: slice.payload?.fill }} />
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
    fill: STATUS_COLOR[tier],
  }));
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const pieData = slices.filter((slice) => slice.value > 0);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="90%"
              paddingAngle={pieData.length > 1 ? 2 : 0}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              animationDuration={500}
            >
              {pieData.map((slice) => (
                <Cell key={slice.name} fill={slice.fill} />
              ))}
            </Pie>
            <Tooltip content={<RiskTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-text text-2xl font-semibold tracking-tight">
            {formatNumber(total)}
          </span>
          <span className="text-text-muted text-[10px] font-medium tracking-wide uppercase">
            Accounts
          </span>
        </div>
      </div>

      <ul className="grid grid-cols-3 gap-2">
        {slices.map((slice) => {
          const pct = total === 0 ? 0 : Math.round((slice.value / total) * 100);
          return (
            <li
              key={slice.name}
              className="border-border bg-surface-raised rounded-md border p-2.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted flex items-center gap-1.5 font-medium">
                  <span
                    className="size-1.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: slice.fill }}
                    aria-hidden
                  />
                  {slice.name}
                </span>
                <span className="num text-text-subtle text-[10px]">{pct}%</span>
              </div>
              <p className="num text-text mt-1 text-base font-semibold">
                {formatNumber(slice.value)}
              </p>
              <div className="bg-surface-elevated mt-2 h-1 w-full overflow-hidden rounded-sm">
                <div
                  className="h-full rounded-sm"
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
