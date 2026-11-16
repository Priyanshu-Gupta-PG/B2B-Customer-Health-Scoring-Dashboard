import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumb && <div className="text-text-muted mb-2 text-xs">{breadcrumb}</div>}
        <h1 className="text-text truncate text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description && <div className="text-text-muted mt-1 text-sm">{description}</div>}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div>
      )}
    </div>
  );
}
