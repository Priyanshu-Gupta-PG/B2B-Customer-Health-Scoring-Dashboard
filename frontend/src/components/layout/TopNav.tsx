"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  ListTodo,
  Menu,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { CronStatusIndicator } from "@/components/system/CronStatusIndicator";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Building2 },
  { href: "/rules", label: "Scoring Rules", icon: SlidersHorizontal },
  { href: "/playbooks", label: "Playbooks", icon: ListTodo },
  { href: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-bg/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/dashboard" className="min-w-0 shrink-0" aria-label="Health Dashboard home">
          <Logo />
        </Link>

        {/* Desktop Navigation with refined pill states */}
        <nav className="ml-6 hidden items-center gap-1.5 lg:flex" aria-label="Primary">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-all duration-200 select-none",
                  active
                    ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border border-white/[0.08]"
                    : "text-text-muted hover:text-text hover:bg-white/[0.04]",
                )}
              >
                <Icon className={cn("size-3.5 transition-colors", active ? "text-blue-400" : "text-text-muted")} />
                <span>{label}</span>
                {active && (
                  <span className="absolute -bottom-[15px] left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-3">
          <CronStatusIndicator className="hidden sm:inline-flex" />
          <UserMenu />
          <button
            type="button"
            className="rounded-lg p-2 text-text-muted hover:bg-surface-raised hover:text-text lg:hidden transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="animate-fade-in border-t border-white/[0.07] bg-surface/95 backdrop-blur-xl px-4 py-3 lg:hidden space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/[0.08] text-white border border-white/[0.08]"
                    : "text-text-muted hover:bg-white/[0.04] hover:text-text",
                )}
              >
                <Icon className={cn("size-4", active ? "text-blue-400" : "text-text-muted")} />
                {label}
              </Link>
            );
          })}
          <div className="pt-2">
            <CronStatusIndicator />
          </div>
        </nav>
      )}
    </header>
  );
}
