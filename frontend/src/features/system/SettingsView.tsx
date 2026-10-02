"use client";

import { Database, Play } from "lucide-react";
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
      toast.success("Ingestion started", result.message);
    } catch (err) {
      toast.error("Ingestion failed", errorMessage(err, "The ingestion job could not be started."));
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="System health, data ingestion, and administrative controls."
        actions={
          isAdmin ? (
            <Button
              className="w-full sm:w-auto"
              onClick={() => void runIngestion()}
              loading={ingest.isPending}
              disabled={running}
              title={running ? "An ingestion job is already running." : undefined}
            >
              <Play className="size-4" />
              Run Data Ingestion
            </Button>
          ) : undefined
        }
      />

      {health.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardBody className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
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
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader
          title="API ingestion"
          description="Background sync from Stripe, Zendesk, and product usage (every 15 minutes)."
          action={<CronStatusIndicator detailed />}
        />
        <CardBody className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-muted text-xs">Last ingestion</dt>
              <dd className="text-text mt-1 break-words">
                {data.last_ingestion_at ? (
                  <>
                    <span className="block">{formatDateTime(data.last_ingestion_at)}</span>
                    <span className="text-text-muted text-xs">{formatRelative(data.last_ingestion_at)}</span>
                  </>
                ) : (
                  "Never"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs">Next scheduled ingest</dt>
              <dd className="text-text mt-1">
                {data.next_ingestion_at ? formatDateTime(data.next_ingestion_at) : "—"}
              </dd>
            </div>
          </dl>
          {!isAdmin && (
            <p className="text-text-muted text-xs">
              Only administrators can trigger a manual ingest.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Database connection"
          description="PostgreSQL connectivity reported by GET /health."
          action={
            <span
              className={cn(
                "border-border bg-surface inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs",
                dbConnected ? "text-success" : "text-danger",
              )}
            >
              <span
                className={cn("size-2 rounded-full", dbConnected ? "bg-success" : "bg-danger")}
                aria-hidden
              />
              {dbConnected ? "Connected" : "Disconnected"}
            </span>
          }
        />
        <CardBody>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-muted text-xs">API status</dt>
              <dd className="text-text mt-1 capitalize">{data.status}</dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs">Uptime</dt>
              <dd className="num text-text mt-1">{formatUptime(data.uptime_seconds)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-text-muted text-xs">Postgres</dt>
              <dd className="text-text mt-1 flex items-center gap-2">
                <Database className="text-text-muted size-3.5" />
                {dbConnected ? "Reachable" : "Unreachable"}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
