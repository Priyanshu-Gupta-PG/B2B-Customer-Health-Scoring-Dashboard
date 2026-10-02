"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Building2, ClipboardList, LayoutDashboard, Menu, Settings, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { CronStatusIndicator } from "@/components/system/CronStatusIndicator";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Building2 },
  { href: "/rules", label: "Scoring Rules", icon: SlidersHorizontal },
  { href: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/dashboard" className="min-w-0 shrink-0" aria-label="Health Dashboard home">
          <Logo />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                isActive(href) ? "bg-primary/15 text-blue-300" : "text-text-muted hover:bg-surface hover:text-text",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <CronStatusIndicator className="hidden sm:inline-flex" />
          <UserMenu />
          <button
            type="button"
            className="rounded-md p-2 text-text-muted hover:bg-surface hover:text-text lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border bg-bg px-4 py-2 lg:hidden" aria-label="Primary mobile">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                isActive(href) ? "bg-primary/15 text-blue-300" : "text-text-muted hover:bg-surface hover:text-text",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <div className="px-3 py-2">
            <CronStatusIndicator />
          </div>
        </nav>
      )}
    </header>
  );
}
