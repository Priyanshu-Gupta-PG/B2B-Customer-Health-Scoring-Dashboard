"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToastStore, type Toast } from "./toast";

const icon = {
  success: <CheckCircle2 className="size-4 text-success" />,
  error: <XCircle className="size-4 text-danger" />,
  warning: <AlertTriangle className="size-4 text-warning" />,
  info: <Info className="size-4 text-primary" />,
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-xl shadow-black/40",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon[toast.tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs text-text-muted">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="rounded p-0.5 text-text-muted hover:text-text"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
