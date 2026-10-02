"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RiskDistributionChart } from "@/components/charts/RiskDistributionChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertBanner, ErrorState } from "@/components/ui/ErrorState";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { KpiCards } from "./KpiCards";
import { TopAtRiskTable } from "./TopAtRiskTable";
import { useDashboardSummary } from "./hooks";

export function DashboardScreen() {
  const { data, isLoading, isError, isFetching, isRefetching, dataUpdatedAt, refetch } =
    useDashboardSummary();
  const highlight = useDataFlash(dataUpdatedAt, Boolean(data) && !isLoading);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Portfolio health at a glance. Scores refresh after each 15-minute ingestion."
      />

      {isLoading ? <DashboardSkeleton /> : null}

      {isError && !data ? (
        <Card>
          <ErrorState
            title="Unable to fetch scores — Database unreachable"
            onRetry={() => {
              void refetch();
            }}
            retrying={isFetching}
          />
        </Card>
      ) : null}

      {data && data.total_accounts === 0 ? (
        <Card>
          <EmptyState
            title="No accounts synced. Check ingestion settings."
            description="Run or wait for data ingestion to populate the portfolio."
            action={
              <Link
                href="/settings"
                className="bg-primary hover:bg-primary-hover focus-visible:ring-primary/50 inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium text-white focus-visible:ring-2 focus-visible:outline-none"
              >
                Open settings
              </Link>
            }
          />
        </Card>
      ) : null}

      {data && data.total_accounts > 0 ? (
        <div className="flex flex-col gap-6">
          {isError ? (
            <AlertBanner>
              Latest refresh failed. Showing the last successful snapshot — retry if figures look
              stale.
            </AlertBanner>
          ) : null}

          <SectionErrorBoundary title="KPI cards failed to render">
            <KpiCards summary={data} highlight={highlight} />
          </SectionErrorBoundary>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Risk distribution"
                description="Healthy 71–100 · At-Risk 31–70 · Critical 0–30"
              />
              <CardBody>
                <SectionErrorBoundary title="Risk chart failed to render">
                  <RiskDistributionChart distribution={data.distribution} />
                </SectionErrorBoundary>
              </CardBody>
            </Card>
            <div className="lg:col-span-3">
              <SectionErrorBoundary title="At-risk table failed to render">
                <TopAtRiskTable accounts={data.top_at_risk} />
              </SectionErrorBoundary>
            </div>
          </div>

          {isRefetching ? (
            <p className="sr-only" aria-live="polite">
              Refreshing dashboard scores
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function useDataFlash(dataUpdatedAt: number, enabled: boolean) {
  const previous = useRef(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!enabled || !dataUpdatedAt) return;
    if (previous.current !== 0 && previous.current !== dataUpdatedAt) {
      setFlash(true);
      const id = window.setTimeout(() => setFlash(false), 900);
      previous.current = dataUpdatedAt;
      return () => window.clearTimeout(id);
    }
    previous.current = dataUpdatedAt;
  }, [dataUpdatedAt, enabled]);

  return flash;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-4 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-36" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <div className="border-border border-b px-5 py-4">
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center justify-center p-8">
            <Skeleton className="size-44 rounded-full" />
          </div>
        </Card>
        <Card className="lg:col-span-3">
          <div className="border-border border-b px-5 py-4">
            <Skeleton className="h-4 w-48" />
          </div>
          <TableSkeleton rows={8} cols={5} />
        </Card>
      </div>
    </div>
  );
}
