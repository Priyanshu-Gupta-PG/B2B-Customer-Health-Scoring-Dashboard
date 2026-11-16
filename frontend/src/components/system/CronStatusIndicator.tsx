"use client";

import { useHealth } from "@/features/system/hooks";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";

/** Live badge showing whether background ingestion is running. */
export function CronStatusIndicator({
  className,
  detailed = false,
}: {
  className?: string;
  detailed?: boolean;
}) {
  const { data, isError } = useHealth();

  const state = isError ? "offline" : (data?.cron_worker ?? "idle");
  const config = {
    running: {
      dot: "bg-primary",
      text: "Sync running",
      pill: "border-primary/25 bg-primary-subtle text-primary",
    },
    idle: {
      dot: "bg-success",
      text: "Sync idle",
      pill: "border-success/25 bg-success-subtle text-success",
    },
    stalled: {
      dot: "bg-warning",
      text: "Sync stalled",
      pill: "border-warning/25 bg-warning-subtle text-warning",
    },
    offline: {
      dot: "bg-danger",
      text: "API offline",
      pill: "border-danger/25 bg-danger-subtle text-danger",
    },
  }[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium",
        config.pill,
        className,
      )}
      title={
        data?.last_ingestion_at ? `Last sync ${formatRelative(data.last_ingestion_at)}` : undefined
      }
    >
      <span className={cn("size-1.5 rounded-sm", config.dot)} aria-hidden />
      <span>{config.text}</span>
      {detailed && data?.last_ingestion_at && (
        <span className="opacity-80">· {formatRelative(data.last_ingestion_at)}</span>
      )}
    </span>
  );
}
