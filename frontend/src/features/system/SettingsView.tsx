"use client";

import { CheckCircle2, Database, Play, Server, Zap } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CronStatusIndicator } from "@/components/system/CronStatusIndicator";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatRelative } from "@/lib/format";
import type { HealthResponse } from "@/types/api";
import { useHealth, useTriggerIngestion } from "./hooks";

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function SettingsView() {
  const { isAdmin } = useAuth();
  const health = useHealth();
  const ingest = useTriggerIngestion();

  const running = health.data?.cron_worker === "running";

  const runIngestion = async () => {
    try {
      const result = await ingest.mutateAsync();
      toast.success("Ingestion triggered", result.message);
    } catch (err) {
      toast.error("Ingestion failed", errorMessage(err, "The ingestion job could not be started."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Infrastructure & Ingestion"
        description="Telemetry sync workers, database health monitoring, and administrative pipeline controls."
        actions={
          isAdmin ? (
            <Button
              className="w-full gap-2 sm:w-auto"
              onClick={() => void runIngestion()}
              loading={ingest.isPending}
              disabled={running}
              title={running ? "An ingestion job is already running." : undefined}
            >
              <Play className="size-3.5 fill-current" />
              <span>Trigger Data Ingestion</span>
            </Button>
          ) : undefined
        }
      />

      {health.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardBody className="space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardBody>
          </Card>
        </div>
      ) : health.isError || !health.data ? (
        <Card>
          <ErrorState
            title="Unable to load system health"
            message={errorMessage(health.error, "The health endpoint could not be reached.")}
            onRetry={() => void health.refetch()}
            retrying={health.isFetching}
          />
        </Card>
      ) : (
        <HealthStatusGrid data={health.data} isAdmin={isAdmin} />
      )}
    </div>
  );
}

function HealthStatusGrid({ data, isAdmin }: { data: HealthResponse; isAdmin: boolean }) {
  const dbConnected = data.postgres === "connected";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* API Ingestion Card */}
      <Card hoverable>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Zap className="text-primary size-4" />
              Automated Ingestion Pipeline
            </span>
          }
          description="Periodic sync from Stripe (billing), Zendesk (support), and product usage telemetry."
          action={<CronStatusIndicator detailed />}
        />
        <CardBody className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-border bg-surface-raised/40 rounded-xl border p-3.5">
              <p className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
                Last Sync Run
              </p>
              <p className="text-text mt-1 truncate text-sm font-semibold">
                {data.last_ingestion_at ? formatRelative(data.last_ingestion_at) : "Waiting"}
              </p>
              <p className="text-text-muted mt-0.5 truncate text-[11px]">
                {data.last_ingestion_at ? formatDateTime(data.last_ingestion_at) : "Never"}
              </p>
            </div>

            <div className="border-border bg-surface-raised/40 rounded-xl border p-3.5">
              <p className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
                Next Scheduled Sync
              </p>
              <p className="text-text mt-1 truncate text-sm font-semibold">
                {data.next_ingestion_at ? formatRelative(data.next_ingestion_at) : "—"}
              </p>
              <p className="text-text-muted mt-0.5 truncate text-[11px]">
                {data.next_ingestion_at ? formatDateTime(data.next_ingestion_at) : "Pending"}
              </p>
            </div>
          </div>

          <div className="border-border text-text-muted flex items-center justify-between border-t pt-4 text-xs">
            <span>
              Cadence: <span className="text-text font-mono">*/15 * * * *</span> (Every 15 min)
            </span>
            {!isAdmin && (
              <span className="text-warning text-[11px]">
                Admin privileges required to force sync
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Database & Infrastructure Card */}
      <Card hoverable>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Server className="text-success size-4" />
              Database & Microservices
            </span>
          }
          description="Primary relational datastore and system health status."
          action={
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
                dbConnected
                  ? "border-success/25 bg-success-subtle text-success"
                  : "border-danger/25 bg-danger-subtle text-danger",
              )}
            >
              <span
                className={cn("size-1.5 rounded-sm", dbConnected ? "bg-success" : "bg-danger")}
                aria-hidden
              />
              {dbConnected ? "Operational" : "Disconnected"}
            </span>
          }
        />
        <CardBody className="space-y-4">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="border-border bg-surface-raised/40 rounded-xl border p-3.5">
              <dt className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
                Overall API Health
              </dt>
              <dd className="text-text mt-1 flex items-center gap-1.5 text-sm font-semibold capitalize">
                <CheckCircle2 className="text-success size-4" />
                {data.status === "ok" ? "All Systems Nominal" : data.status}
              </dd>
            </div>

            <div className="border-border bg-surface-raised/40 rounded-xl border p-3.5">
              <dt className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
                Engine Uptime
              </dt>
              <dd className="num text-text mt-1 text-sm font-semibold">
                {formatUptime(data.uptime_seconds)}
              </dd>
            </div>

            <div className="border-border bg-surface-raised/40 flex items-center justify-between rounded-xl border p-3.5 sm:col-span-2">
              <div>
                <dt className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
                  PostgreSQL Connection
                </dt>
                <dd className="text-text mt-1 font-mono text-xs">
                  {dbConnected ? "Pooled connection active" : "Offline / Unreachable"}
                </dd>
              </div>
              <Database className="text-text-muted size-5" />
            </div>
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
