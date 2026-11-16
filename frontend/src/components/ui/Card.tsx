import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "panel overflow-hidden",
        hoverable && "panel-hover transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-text text-sm font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-text-muted mt-0.5 text-xs">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
