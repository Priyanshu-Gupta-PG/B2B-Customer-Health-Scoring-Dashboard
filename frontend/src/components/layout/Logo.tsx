import { Activity } from "lucide-react";
import { cn } from "@/lib/cn";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      <span className="bg-primary flex size-7 items-center justify-center rounded-md text-[color:var(--on-primary)]">
        <Activity className="size-3.5" strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="text-text block text-sm font-semibold tracking-tight">PulseScore</span>
          <span className="text-text-muted block text-[10px] font-medium tracking-[0.08em] uppercase">
            Customer health
          </span>
        </span>
      )}
    </span>
  );
}
