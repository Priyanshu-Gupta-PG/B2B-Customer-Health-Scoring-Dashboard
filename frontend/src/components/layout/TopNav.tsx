"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { CronStatusIndicator } from "@/components/system/CronStatusIndicator";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Building2 },
  { href: "/rules", label: "Rules", icon: SlidersHorizontal },
  { href: "/audit-log", label: "Audit", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="border-border bg-surface/95 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-screen-2xl items-center gap-3 px-4 sm:px-6">
        <Link href="/dashboard" className="min-w-0 shrink-0" aria-label="PulseScore home">
          <Logo />
        </Link>

        <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors select-none",
                  active
                    ? "bg-surface-elevated text-text"
                    : "text-text-muted hover:bg-surface-elevated/70 hover:text-text",
                )}
              >
                <Icon className="size-3.5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <CronStatusIndicator className="hidden sm:inline-flex" />
          <ThemeToggle />
          <UserMenu />
          <button
            type="button"
            className="text-text-muted hover:bg-surface-elevated hover:text-text cursor-pointer rounded-md p-1.5 transition-colors lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="animate-fade-in border-border bg-surface space-y-0.5 border-t px-4 py-2 lg:hidden">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-elevated text-text"
                    : "text-text-muted hover:bg-surface-elevated hover:text-text",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
          <div className="pt-2 pb-1">
            <CronStatusIndicator />
          </div>
        </nav>
      )}
    </header>
  );
}
