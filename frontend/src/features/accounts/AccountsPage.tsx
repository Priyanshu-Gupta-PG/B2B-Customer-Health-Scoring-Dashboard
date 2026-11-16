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
      <div className="border-border flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-text text-2xl font-semibold tracking-tight">Customer Portfolio</h1>
          <p className="text-text-muted mt-1 text-sm">
            Search, sort, and triage account health across the managed book.
          </p>
        </div>

        {!isPending && total > 0 && (
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter by health status"
          >
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
    healthy: "border-success/25 bg-success-subtle text-success hover:bg-success-subtle",
    risk: "border-warning/25 bg-warning-subtle text-warning hover:bg-warning-subtle",
    critical: "border-danger/25 bg-danger-subtle text-danger hover:bg-danger-subtle",
  } as const;

  const activeRing = {
    healthy: "ring-2 ring-success/35",
    risk: "ring-2 ring-warning/35",
    critical: "ring-2 ring-danger/35",
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
      <div className="border-border border-b pb-5">
        <h1 className="text-text text-2xl font-semibold tracking-tight">Customer Portfolio</h1>
        <p className="text-text-muted mt-1 text-sm">Loading account directory…</p>
      </div>
    </div>
  );
}
