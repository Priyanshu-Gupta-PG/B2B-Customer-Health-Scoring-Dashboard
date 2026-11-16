import type { HealthStatus } from "@/types/api";
import { getStatusTier } from "@/lib/status";
import { cn } from "@/lib/cn";

const styles: Record<HealthStatus, string> = {
  Critical: "bg-danger-subtle text-danger border-danger/25",
  "At-Risk": "bg-warning-subtle text-warning border-warning/25",
  Healthy: "bg-success-subtle text-success border-success/25",
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
        "inline-flex items-center gap-1.5 rounded border font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs",
        styles[tier],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-sm", dot[tier])} aria-hidden />
      {tier}
    </span>
  );
}
