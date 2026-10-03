import { Activity } from "lucide-react";
import { cn } from "@/lib/cn";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
        <Activity className="size-4" strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-text">Health Dashboard</span>
          <span className="block text-[10px] uppercase tracking-wider text-text-muted">Customer Success</span>
        </span>
      )}
    </span>
  );
}
