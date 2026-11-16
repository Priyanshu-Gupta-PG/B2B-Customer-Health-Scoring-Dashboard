"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToastStore, type Toast } from "./toast";

const icon = {
  success: <CheckCircle2 className="text-success size-4" />,
  error: <XCircle className="text-danger size-4" />,
  warning: <AlertTriangle className="text-warning size-4" />,
  info: <Info className="text-primary size-4" />,
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
        "border-border bg-surface pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-xl shadow-black/40",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon[toast.tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-text text-sm font-medium">{toast.title}</p>
        {toast.description && <p className="text-text-muted mt-0.5 text-xs">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="text-text-muted hover:text-text rounded p-0.5"
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
