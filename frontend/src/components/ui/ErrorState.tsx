import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retrying = false,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}
      role="alert"
    >
      <div className="bg-danger-subtle text-danger mb-4 flex size-10 items-center justify-center rounded-md">
        <AlertTriangle className="size-5" />
      </div>
      <h3 className="text-text text-sm font-semibold">{title}</h3>
      {message && <p className="text-text-muted mt-1 max-w-md text-sm">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry} loading={retrying}>
          <RefreshCw className="size-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

export function AlertBanner({
  tone = "danger",
  children,
  className,
}: {
  tone?: "danger" | "warning" | "info";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    danger: "border-danger/30 bg-danger-subtle text-danger",
    warning: "border-warning/30 bg-warning-subtle text-warning",
    info: "border-primary/30 bg-primary-subtle text-primary",
  };
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border px-4 py-3 text-sm",
        tones[tone],
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
