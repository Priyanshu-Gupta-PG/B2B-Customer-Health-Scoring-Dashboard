"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { ApiError } from "@/lib/errors";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { NotFoundExperience } from "@/components/ui/NotFoundExperience";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { HealthTrendChart, type HistoryRange } from "@/components/charts/HealthTrendChart";
import { useRules } from "@/features/rules/hooks";
import { AccountInfoCard } from "./AccountInfoCard";
import { AccountMetricsList } from "./AccountMetricsList";
import { useAccount, useAccountHistory } from "./hooks";

export function AccountDetailPage({ accountId }: { accountId: string }) {
  const [days, setDays] = useState<HistoryRange>(30);
  const accountQuery = useAccount(accountId);
  const historyQuery = useAccountHistory(accountId, days);
  const rulesQuery = useRules();

  const accountError = accountQuery.error;
  const notFound = accountError instanceof ApiError && accountError.status === 404;
  const historyError = historyQuery.error;
  const historyMissing = historyError instanceof ApiError && historyError.status === 404;

  if (accountQuery.isPending) {
    return <AccountDetailSkeleton />;
  }

  if (notFound) {
    return (
      <NotFoundExperience
        title="Client account not found"
        description="This customer account does not exist or has been removed from active management."
        href="/accounts"
        actionLabel="Return to Accounts Directory"
      />
    );
  }

  if (accountQuery.isError || !accountQuery.data) {
    return (
      <Card>
        <ErrorState
          title="Failed to load account details"
          message={accountError instanceof Error ? accountError.message : undefined}
          onRetry={() => {
            void accountQuery.refetch();
          }}
          retrying={accountQuery.isFetching}
        />
      </Card>
    );
  }

  const account = accountQuery.data;
  const history = historyMissing ? [] : (historyQuery.data?.history ?? []);
  const isAtRisk = account.current_score <= 70;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <PageHeader
        breadcrumb={
          <Link
            href="/accounts"
            className="group text-text-muted hover:text-text inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="size-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Accounts Directory</span>
          </Link>
        }
        title={
          <div className="flex items-center gap-3">
            <span>{account.company_name}</span>
          </div>
        }
        description={
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-text-muted font-mono">{account.domain}</span>
            <span className="text-text-subtle">·</span>
            <span className="text-text-muted">{account.plan} Tier</span>
            <span className="text-text-subtle">·</span>
            <span className="text-text-muted">Managed by {account.owner_csm}</span>
          </div>
        }
      />

      {isAtRisk && (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
            account.current_score <= 30
              ? "border-danger/30 bg-danger-subtle"
              : "border-warning/30 bg-warning-subtle",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                account.current_score <= 30
                  ? "bg-danger-subtle text-danger"
                  : "bg-warning-subtle text-warning",
              )}
            >
              <ShieldAlert className="size-4" />
            </div>
            <div>
              <p
                className={cn(
                  "text-xs font-semibold",
                  account.current_score <= 30 ? "text-danger" : "text-warning",
                )}
              >
                {account.current_score <= 30 ? "Critical — prioritize outreach" : "Elevated risk"}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[11px]",
                  account.current_score <= 30 ? "text-danger" : "text-warning",
                )}
              >
                Score {account.current_score}/100. Check support load, usage drop-off, or overdue
                invoices below.
              </p>
            </div>
          </div>
          <Link
            href="/rules"
            className={cn(
              "hover:text-text shrink-0 text-xs font-medium underline",
              account.current_score <= 30 ? "text-danger" : "text-warning",
            )}
          >
            Review scoring formula
          </Link>
        </div>
      )}

      {/* Main Grid: Account Info Card & Trend Chart */}
      <div className="grid gap-6 xl:grid-cols-3">
        <AccountInfoCard account={account} />
        <div className="xl:col-span-2">
          <SectionErrorBoundary title="Health trend failed to render">
            <HealthTrendChart
              data={history}
              days={days}
              onDaysChange={setDays}
              isLoading={historyQuery.isPending || historyQuery.isPlaceholderData}
              isError={historyQuery.isError && !historyMissing}
              onRetry={() => {
                void historyQuery.refetch();
              }}
            />
          </SectionErrorBoundary>
        </div>
      </div>

      <div>
        <AccountMetricsList metrics={account.metrics} rules={rulesQuery.data ?? []} />
      </div>
    </div>
  );
}

function AccountDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading account" className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardBody className="space-y-4">
            <Skeleton className="h-4 w-40" />
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardBody>
            <Skeleton className="h-72 w-full" />
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardBody className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
