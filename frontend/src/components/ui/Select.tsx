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
        <label htmlFor={selectId} className="text-xs font-medium text-text-muted select-none">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-9 w-full appearance-none rounded-lg border bg-surface-raised/50 pl-3 pr-9 text-xs text-text transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 cursor-pointer",
            error
              ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-white/[0.08] focus:border-blue-500/50 focus:ring-blue-500/20 hover:border-white/[0.14]",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-text-muted" />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
});
