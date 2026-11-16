"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/features/theme/ThemeProvider";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className={cn(
        "border-border bg-surface text-text-muted hover:bg-surface-elevated hover:text-text inline-flex size-8 cursor-pointer items-center justify-center rounded-md border transition-colors",
        className,
      )}
    >
      {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </button>
  );
}
