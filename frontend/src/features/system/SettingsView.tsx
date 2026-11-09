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
              className="w-full sm:w-auto gap-2"
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
    <div className="grid gap-6 md:grid-cols-2 animate-fade-in-up">
      {/* API Ingestion Card */}
      <Card hoverable>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Zap className="size-4 text-blue-400" />
              Automated Ingestion Pipeline
            </span>
          }
          description="Periodic sync from Stripe (billing), Zendesk (support), and product usage telemetry."
          action={<CronStatusIndicator detailed />}
        />
        <CardBody className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.06] bg-surface-raised/40 p-3.5">
              <p className="text-text-muted text-[11px] font-semibold uppercase tracking-wider">Last Sync Run</p>
              <p className="text-text mt-1 text-sm font-semibold truncate">
                {data.last_ingestion_at ? formatRelative(data.last_ingestion_at) : "Waiting"}
              </p>
              <p className="text-text-muted text-[11px] mt-0.5 truncate">
                {data.last_ingestion_at ? formatDateTime(data.last_ingestion_at) : "Never"}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-surface-raised/40 p-3.5">
              <p className="text-text-muted text-[11px] font-semibold uppercase tracking-wider">Next Scheduled Sync</p>
              <p className="text-text mt-1 text-sm font-semibold truncate">
                {data.next_ingestion_at ? formatRelative(data.next_ingestion_at) : "—"}
              </p>
              <p className="text-text-muted text-[11px] mt-0.5 truncate">
                {data.next_ingestion_at ? formatDateTime(data.next_ingestion_at) : "Pending"}
              </p>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4 text-xs text-text-muted flex items-center justify-between">
            <span>Cadence: <span className="font-mono text-text">*/15 * * * *</span> (Every 15 min)</span>
            {!isAdmin && (
              <span className="text-[11px] text-amber-400">Admin privileges required to force sync</span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Database & Infrastructure Card */}
      <Card hoverable>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Server className="size-4 text-emerald-400" />
              Database & Microservices
            </span>
          }
          description="Primary relational datastore and system health status."
          action={
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
                dbConnected
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-300",
              )}
            >
              <span
                className={cn("size-1.5 rounded-full", dbConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400")}
                aria-hidden
              />
              {dbConnected ? "Operational" : "Disconnected"}
            </span>
          }
        />
        <CardBody className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border border-white/[0.06] bg-surface-raised/40 p-3.5">
              <dt className="text-text-muted text-[11px] font-semibold uppercase tracking-wider">Overall API Health</dt>
              <dd className="text-text mt-1 text-sm font-semibold capitalize flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-400" />
                {data.status === "ok" ? "All Systems Nominal" : data.status}
              </dd>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-surface-raised/40 p-3.5">
              <dt className="text-text-muted text-[11px] font-semibold uppercase tracking-wider">Engine Uptime</dt>
              <dd className="num text-text mt-1 text-sm font-semibold">{formatUptime(data.uptime_seconds)}</dd>
            </div>

            <div className="sm:col-span-2 rounded-xl border border-white/[0.06] bg-surface-raised/40 p-3.5 flex items-center justify-between">
              <div>
                <dt className="text-text-muted text-[11px] font-semibold uppercase tracking-wider">PostgreSQL Connection</dt>
                <dd className="text-text mt-1 text-xs font-mono">
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
