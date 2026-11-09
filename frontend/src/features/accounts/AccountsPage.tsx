"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { AccountDataGrid } from "@/components/tables/AccountDataGrid";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { formatNumber } from "@/lib/format";
import { useAllAccounts } from "./hooks";

export function AccountsPage() {
  const { data, isPending, isError, refetch } = useAllAccounts();

  const accounts = data?.data ?? [];
  const total = accounts.length;
  const critical = accounts.filter((a) => a.health_status === "Critical").length;
  const atRisk = accounts.filter((a) => a.health_status === "At-Risk").length;
  const healthy = accounts.filter((a) => a.health_status === "Healthy").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Customer Portfolio Directory</h1>
          <p className="text-text-muted text-xs mt-1">
            Search, sort, and inspect composite health telemetry across all managed enterprise accounts.
          </p>
        </div>

        {/* Quick count chips */}
        {!isPending && total > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="size-3.5" />
              <span>{formatNumber(healthy)} Healthy</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
              <AlertTriangle className="size-3.5" />
              <span>{formatNumber(atRisk)} At-Risk</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300">
              <ShieldAlert className="size-3.5" />
              <span>{formatNumber(critical)} Critical</span>
            </span>
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
