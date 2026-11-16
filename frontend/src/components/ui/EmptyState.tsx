import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}
    >
      <div className="bg-surface-raised text-text-muted mb-4 flex size-12 items-center justify-center rounded-full">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <h3 className="text-text text-sm font-semibold">{title}</h3>
      {description && <p className="text-text-muted mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
