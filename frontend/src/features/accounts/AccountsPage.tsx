"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { AccountDataGrid } from "@/components/tables/AccountDataGrid";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { HealthStatus } from "@/types/api";
import { useAllAccounts } from "./hooks";

export function AccountsPage() {
  return (
    <Suspense fallback={<AccountsPageFallback />}>
      <AccountsPageInner />
    </Suspense>
  );
}

function AccountsPageInner() {
  const { data, isPending, isError, refetch } = useAllAccounts();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status");

  const accounts = data?.data ?? [];
  const total = accounts.length;
  const critical = accounts.filter((a) => a.health_status === "Critical").length;
  const atRisk = accounts.filter((a) => a.health_status === "At-Risk").length;
  const healthy = accounts.filter((a) => a.health_status === "Healthy").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Customer Portfolio</h1>
          <p className="text-text-muted text-sm mt-1">
            Search, sort, and triage account health across the managed book.
          </p>
        </div>

        {!isPending && total > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by health status">
            <StatusChip
              href="/accounts?status=Healthy"
              active={activeStatus === "Healthy"}
              count={healthy}
              label="Healthy"
              tone="healthy"
              icon={<CheckCircle2 className="size-3.5" />}
            />
            <StatusChip
              href="/accounts?status=At-Risk"
              active={activeStatus === "At-Risk"}
              count={atRisk}
              label="At-Risk"
              tone="risk"
              icon={<AlertTriangle className="size-3.5" />}
            />
            <StatusChip
              href="/accounts?status=Critical"
              active={activeStatus === "Critical"}
              count={critical}
              label="Critical"
              tone="critical"
              icon={<ShieldAlert className="size-3.5" />}
            />
          </div>
        )}
      </div>

      <SectionErrorBoundary title="Accounts table failed to render">
        <AccountDataGrid
          data={accounts}
          isLoading={isPending}
          isError={isError}
          onRetry={() => {
            void refetch();
          }}
        />
      </SectionErrorBoundary>
    </div>
  );
}

function StatusChip({
  href,
  active,
  count,
  label,
  tone,
  icon,
}: {
  href: string;
  active: boolean;
  count: number;
  label: HealthStatus;
  tone: "healthy" | "risk" | "critical";
  icon: ReactNode;
}) {
  const tones = {
    healthy: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15",
    risk: "border-amber-500/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15",
    critical: "border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15",
  } as const;

  const activeRing = {
    healthy: "ring-2 ring-emerald-400/40",
    risk: "ring-2 ring-amber-400/40",
    critical: "ring-2 ring-rose-400/40",
  } as const;

  return (
    <Link
      href={active ? "/accounts" : href}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all",
        tones[tone],
        active && activeRing[tone],
      )}
    >
      {icon}
      <span>
        {formatNumber(count)} {label}
      </span>
    </Link>
  );
}

function AccountsPageFallback() {
  return (
    <div className="space-y-6">
      <div className="border-b border-white/[0.06] pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Customer Portfolio</h1>
        <p className="text-text-muted text-sm mt-1">Loading account directory…</p>
      </div>
    </div>
  );
}
