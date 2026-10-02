import type { HealthStatus } from "@/types/api";
import { getStatusTier } from "@/lib/status";
import { cn } from "@/lib/cn";

const styles: Record<HealthStatus, string> = {
  Critical: "bg-danger/15 text-danger ring-danger/30",
  "At-Risk": "bg-warning/15 text-warning ring-warning/30",
  Healthy: "bg-success/15 text-success ring-success/30",
};

const dot: Record<HealthStatus, string> = {
  Critical: "bg-danger",
  "At-Risk": "bg-warning",
  Healthy: "bg-success",
};

export function StatusBadge({
  status,
  score,
  size = "md",
  className,
}: {
  status?: HealthStatus;
  score?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const tier = status ?? getStatusTier(score ?? 100);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        styles[tier],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot[tier])} aria-hidden />
      {tier}
    </span>
  );
}
