"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input, select, button, textarea, [tabindex]:not([tabindex='-1'])",
    );
    first?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "panel animate-scale-in flex max-h-[92vh] w-full flex-col overflow-hidden",
          size === "lg" ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <div className="border-border flex items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <h2 id="modal-title" className="text-text text-base font-semibold tracking-tight">
              {title}
            </h2>
            {description && <p className="text-text-muted mt-1 text-xs">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-text-muted hover:bg-surface-raised hover:text-text cursor-pointer rounded-lg p-1.5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="border-border bg-surface-raised flex flex-wrap justify-end gap-2.5 border-t px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
