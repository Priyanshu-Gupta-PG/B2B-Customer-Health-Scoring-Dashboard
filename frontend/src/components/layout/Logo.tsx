import { Activity } from "lucide-react";
import { cn } from "@/lib/cn";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("group inline-flex items-center gap-2.5 select-none", className)}>
      <span className="relative flex size-8 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_2px_10px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] transition-transform duration-200 group-hover:scale-105">
        <Activity className="size-4 transition-transform duration-300 group-hover:rotate-12" strokeWidth={2.2} />
        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-surface animate-soft-pulse" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight text-text group-hover:text-white transition-colors">
            PulseScore
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Customer Health OS
          </span>
        </span>
      )}
    </span>
  );
}
