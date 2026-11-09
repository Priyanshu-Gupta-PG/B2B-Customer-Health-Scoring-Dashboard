import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, leading, trailing, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-text-muted select-none">
          {label}
        </label>
      )}
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            "h-9 w-full rounded-lg border bg-surface-raised/50 px-3 text-xs text-text placeholder:text-text-subtle transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50",
            error
              ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-white/[0.08] focus:border-blue-500/50 focus:ring-blue-500/20 hover:border-white/[0.14]",
            leading && "pl-9",
            trailing && "pr-9",
            className,
          )}
          {...props}
        />
        {trailing && <span className="absolute inset-y-0 right-3 flex items-center text-text-muted">{trailing}</span>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
