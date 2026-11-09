import type { HealthStatus } from "@/types/api";
import { getStatusTier } from "@/lib/status";
import { cn } from "@/lib/cn";

const styles: Record<HealthStatus, string> = {
  Critical: "bg-danger/10 text-rose-300 ring-danger/20 border-danger/30 shadow-[0_0_12px_rgba(244,63,94,0.1)]",
  "At-Risk": "bg-warning/10 text-amber-300 ring-warning/20 border-warning/30 shadow-[0_0_12px_rgba(245,158,11,0.1)]",
  Healthy: "bg-success/10 text-emerald-300 ring-success/20 border-success/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]",
};

const dot: Record<HealthStatus, string> = {
  Critical: "bg-danger shadow-[0_0_6px_rgba(244,63,94,0.6)]",
  "At-Risk": "bg-warning shadow-[0_0_6px_rgba(245,158,11,0.6)]",
  Healthy: "bg-success shadow-[0_0_6px_rgba(16,185,129,0.6)]",
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
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset backdrop-blur-sm border transition-all duration-200",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        styles[tier],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full animate-pulse", dot[tier])} aria-hidden />
      {tier}
    </span>
  );
}
