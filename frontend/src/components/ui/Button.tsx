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
    "bg-primary text-white shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-primary-hover focus-visible:ring-primary/40 active:translate-y-[1px] disabled:bg-primary/40 disabled:shadow-none",
  secondary:
    "border border-border bg-surface-raised/70 text-text shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-surface-elevated hover:border-border-focus focus-visible:ring-primary/30 active:translate-y-[1px] disabled:opacity-40",
  ghost:
    "text-text-muted hover:bg-surface-raised hover:text-text focus-visible:ring-primary/30 active:translate-y-[1px] disabled:opacity-40",
  danger:
    "bg-danger text-white shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-rose-600 focus-visible:ring-danger/40 active:translate-y-[1px] disabled:bg-danger/40",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9 px-3.5 text-xs font-medium gap-2 rounded-lg",
  lg: "h-10 px-4 text-sm font-medium gap-2 rounded-xl",
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
        "inline-flex cursor-pointer items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed select-none",
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
