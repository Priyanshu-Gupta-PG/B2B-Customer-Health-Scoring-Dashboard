import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-primary text-[color:var(--on-primary)] hover:bg-primary-hover focus-visible:ring-primary/35 disabled:bg-primary/45",
  secondary:
    "border border-border bg-surface text-text hover:bg-surface-elevated focus-visible:ring-primary/25 disabled:opacity-45",
  ghost:
    "text-text-muted hover:bg-surface-elevated hover:text-text focus-visible:ring-primary/25 disabled:opacity-45",
  danger:
    "bg-danger text-[color:var(--on-danger)] hover:opacity-90 focus-visible:ring-danger/35 disabled:bg-danger/45",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-xs font-medium gap-2 rounded-md",
  lg: "h-10 px-4 text-sm font-medium gap-2 rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center font-medium transition-colors duration-100 select-none focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
