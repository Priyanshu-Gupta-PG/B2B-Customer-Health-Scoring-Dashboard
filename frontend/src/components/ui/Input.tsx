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
        <label htmlFor={inputId} className="text-text-muted text-xs font-medium select-none">
          {label}
        </label>
      )}
      <div className="relative">
        {leading && (
          <span className="text-text-muted pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            "bg-surface text-text placeholder:text-text-subtle h-9 w-full rounded-md border px-3 text-xs transition-colors focus:ring-2 focus:outline-none disabled:opacity-50",
            error
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : "border-border focus:border-primary focus:ring-primary/20 hover:border-border-focus",
            leading && "pl-9",
            trailing && "pr-9",
            className,
          )}
          {...props}
        />
        {trailing && (
          <span className="text-text-muted absolute inset-y-0 right-3 flex items-center">
            {trailing}
          </span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-danger text-xs">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-text-muted text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
