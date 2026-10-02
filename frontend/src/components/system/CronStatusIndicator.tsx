"use client";

import { useHealth } from "@/features/system/hooks";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";

/** Live badge showing whether background ingestion is running (UX-B2B-01 §7). */
export function CronStatusIndicator({ className, detailed = false }: { className?: string; detailed?: boolean }) {
  const { data, isError } = useHealth();

  const state = isError ? "offline" : (data?.cron_worker ?? "idle");
  const config = {
    running: { dot: "bg-primary animate-pulse", text: "Ingestion running" },
    idle: { dot: "bg-success", text: "Ingestion idle" },
    stalled: { dot: "bg-warning", text: "Ingestion stalled" },
    offline: { dot: "bg-danger", text: "API offline" },
  }[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-text-muted",
        className,
      )}
      title={data?.last_ingestion_at ? `Last sync ${formatRelative(data.last_ingestion_at)}` : undefined}
    >
      <span className={cn("size-2 rounded-full", config.dot)} aria-hidden />
      {config.text}
      {detailed && data?.last_ingestion_at && (
        <span className="text-text-muted/70">· synced {formatRelative(data.last_ingestion_at)}</span>
      )}
    </span>
  );
}
