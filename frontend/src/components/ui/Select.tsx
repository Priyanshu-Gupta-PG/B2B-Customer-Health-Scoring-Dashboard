import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, error, id, children, ...props },
  ref,
) {
  const selectId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-text-muted text-xs font-medium select-none">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "bg-surface text-text h-9 w-full cursor-pointer appearance-none rounded-md border pr-9 pl-3 text-xs transition-colors focus:ring-2 focus:outline-none disabled:opacity-50",
            error
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : "border-border focus:border-primary focus:ring-primary/20 hover:border-border-focus",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="text-text-muted pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2" />
      </div>
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
});
