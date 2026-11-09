"use client";

import { useHealth } from "@/features/system/hooks";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";

/** Live badge showing whether background ingestion is running. */
export function CronStatusIndicator({ className, detailed = false }: { className?: string; detailed?: boolean }) {
  const { data, isError } = useHealth();

  const state = isError ? "offline" : (data?.cron_worker ?? "idle");
  const config = {
    running: {
      dot: "bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse",
      text: "Ingestion active",
      pill: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    },
    idle: {
      dot: "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
      text: "Pipeline idle",
      pill: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    },
    stalled: {
      dot: "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
      text: "Worker stalled",
      pill: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    },
    offline: {
      dot: "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.5)]",
      text: "API offline",
      pill: "border-rose-500/20 bg-rose-500/10 text-rose-300",
    },
  }[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm transition-all",
        config.pill,
        className,
      )}
      title={data?.last_ingestion_at ? `Last sync ${formatRelative(data.last_ingestion_at)}` : undefined}
    >
      <span className={cn("size-1.5 rounded-full", config.dot)} aria-hidden />
      <span>{config.text}</span>
      {detailed && data?.last_ingestion_at && (
        <span className="opacity-75">· {formatRelative(data.last_ingestion_at)}</span>
      )}
    </span>
  );
}
