"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { RiskDistributionChart } from "@/components/charts/RiskDistributionChart";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertBanner, ErrorState } from "@/components/ui/ErrorState";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { KpiCards } from "./KpiCards";
import { TopAtRiskTable } from "./TopAtRiskTable";
import { errorMessage } from "@/lib/errors";
import { useDashboardSummary } from "./hooks";

export function DashboardScreen() {
  const { data, error, isLoading, isError, isFetching, isRefetching, dataUpdatedAt, refetch } =
    useDashboardSummary();
  const highlight = useDataFlash(dataUpdatedAt, Boolean(data) && !isLoading);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry Engine
            </span>
            <span className="text-xs text-text-muted hidden sm:inline">· 15-minute sync interval</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Customer Health Console</h1>
          <p className="text-text-muted text-xs mt-1">
            Real-time multi-signal scoring derived from product usage, support tickets, and invoicing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            loading={isFetching}
            className="group"
          >
            <RefreshCw className="size-3.5 transition-transform duration-300 group-hover:rotate-180" />
            <span>Refresh</span>
          </Button>
          <Link href="/accounts">
            <Button size="sm" variant="primary" className="gap-1.5">
              <span>View All Accounts</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? <DashboardSkeleton /> : null}

      {isError && !data ? (
        <Card>
          <ErrorState
            title={errorMessage(error, "Unable to fetch scores")}
            message="Confirm the backend or MSW mock is active. Health status can be checked in Settings."
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
            title="No accounts synced yet."
            description="Run data ingestion or wait for scheduled sync to populate portfolio accounts."
            action={
              <Link href="/settings">
                <Button size="sm">Open Ingestion Settings</Button>
              </Link>
            }
          />
        </Card>
      ) : null}

      {data && data.total_accounts > 0 ? (
        <div className="flex flex-col gap-6 animate-fade-in-up">
          {isError ? (
            <AlertBanner>
              Latest refresh failed. Showing last cached snapshot — click Refresh to re-attempt.
            </AlertBanner>
          ) : null}

          {/* KPI Metrics Grid */}
          <SectionErrorBoundary title="KPI cards failed to render">
            <div className="animate-fade-in-up stagger-1">
              <KpiCards summary={data} highlight={highlight} />
            </div>
          </SectionErrorBoundary>

          {/* Secondary Analytical Grid */}
          <div className="grid gap-6 lg:grid-cols-5 animate-fade-in-up stagger-2">
            {/* Risk Distribution Donut */}
            <Card className="lg:col-span-2">
              <CardHeader
                title="Portfolio Risk Distribution"
                description="Healthy 71–100 · At-Risk 31–70 · Critical 0–30"
              />
              <CardBody>
                <SectionErrorBoundary title="Risk chart failed to render">
                  <RiskDistributionChart distribution={data.distribution} />
                </SectionErrorBoundary>
              </CardBody>
            </Card>

            {/* Top At-Risk Table */}
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
