"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/errors";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { NotFoundExperience } from "@/components/ui/NotFoundExperience";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { HealthTrendChart, type HistoryRange } from "@/components/charts/HealthTrendChart";
import { AccountInfoCard } from "./AccountInfoCard";
import { AccountMetricsList } from "./AccountMetricsList";
import { useAccount, useAccountHistory } from "./hooks";

export function AccountDetailPage({ accountId }: { accountId: string }) {
  const [days, setDays] = useState<HistoryRange>(30);
  const accountQuery = useAccount(accountId);
  const historyQuery = useAccountHistory(accountId, days);

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
        title="Client not found"
        description="This account does not exist or is no longer in the portfolio."
        href="/accounts"
        actionLabel="Back to accounts"
      />
    );
  }

  if (accountQuery.isError || !accountQuery.data) {
    return (
      <Card>
        <ErrorState
          title="Failed to load account"
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

  return (
    <div>
      <PageHeader
        breadcrumb={
          <Link href="/accounts" className="inline-flex items-center gap-1 hover:text-text">
            <ArrowLeft className="size-3" /> Accounts
          </Link>
        }
        title={account.company_name}
        description={`${account.domain} · ${account.plan}`}
      />

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

      <div className="mt-6">
        <AccountMetricsList metrics={account.metrics} />
      </div>
    </div>
  );
}

function AccountDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading account">
      <div className="mb-6 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
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
            <Skeleton className="h-64 w-full" />
          </CardBody>
        </Card>
      </div>
      <Card className="mt-6">
        <CardBody className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
