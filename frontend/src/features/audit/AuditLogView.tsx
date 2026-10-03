"use client";

import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, metricLabel } from "@/lib/format";
import type { AuditAction, AuditLogEntry, AuditLogParams } from "@/types/api";
import { useAuditActors, useAuditLogs } from "./hooks";

const PAGE_SIZE = 25;

const ACTION_LABEL: Record<AuditAction, string> = {
  RULE_UPDATED: "Updated scoring rule",
  RULES_BULK_UPDATED: "Bulk updated scoring rules",
  RECALCULATION_RUN: "Recalculated scores",
  INGESTION_TRIGGERED: "Triggered data ingestion",
};

function actionLabel(entry: AuditLogEntry) {
  if (entry.action === "RULE_UPDATED" && entry.metric_name) {
    return `Updated ${metricLabel(entry.metric_name)}`;
  }
  return ACTION_LABEL[entry.action] ?? entry.action;
}

function weightFrom(state: Record<string, unknown> | null): number | null {
  const value = state?.weight_percentage;
  return typeof value === "number" ? value : null;
}

function formatWeight(value: number | null) {
  return value == null ? "—" : `${value}%`;
}

export function AuditLogView() {
  const [pageIndex, setPageIndex] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [actor, setActor] = useState("");

  const params = useMemo<AuditLogParams>(
    () => ({
      limit: PAGE_SIZE,
      offset: pageIndex * PAGE_SIZE,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(actor ? { actor } : {}),
    }),
    [pageIndex, from, to, actor],
  );

  const logs = useAuditLogs(params);
  const actors = useAuditActors();

  const rows = logs.data?.data ?? [];
  const total = logs.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(from || to || actor);
  const isEmpty = !logs.isLoading && !logs.isError && total === 0;

  const resetPage = () => setPageIndex(0);

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setActor("");
    resetPage();
  };

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="History of scoring-rule changes and administrative actions."
      />

      <Card>
        <div className="border-border grid grid-cols-1 gap-3 border-b px-4 py-4 sm:grid-cols-2 sm:px-5 lg:flex lg:flex-row lg:items-end">
          <div className="w-full lg:w-44">
            <Input
              id="audit-from"
              type="date"
              label="From"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                resetPage();
              }}
            />
          </div>
          <div className="w-full lg:w-44">
            <Input
              id="audit-to"
              type="date"
              label="To"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                resetPage();
              }}
            />
          </div>
          <div className="w-full sm:col-span-2 lg:w-64">
            <Select
              id="audit-actor"
              label="Admin user"
              value={actor}
              disabled={actors.isLoading}
              onChange={(e) => {
                setActor(e.target.value);
                resetPage();
              }}
            >
              <option value="">All admins</option>
              {(actors.data ?? []).map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </Select>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="w-fit lg:mb-0.5" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {logs.isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : logs.isError ? (
          <ErrorState
            title="Unable to load audit log"
            message={errorMessage(logs.error, "The audit log could not be retrieved.")}
            onRetry={() => void logs.refetch()}
            retrying={logs.isFetching}
          />
        ) : isEmpty ? (
          <EmptyState
            icon={<ClipboardList className="size-5" />}
            title="No rule changes recorded yet."
            description={
              hasFilters
                ? "No entries match the selected date range or admin user."
                : "Weight edits and other admin actions will appear here."
            }
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <SectionErrorBoundary title="Audit log table failed to render">
            <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm" aria-label="Audit log">
                <thead className="border-border bg-surface-raised/40 text-text-muted border-b text-xs tracking-wide uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Timestamp
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Admin Actor
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Action
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      Old Weight
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      New Weight
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {rows.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-raised/40">
                      <td className="num text-text px-5 py-3.5 whitespace-nowrap">
                        {formatDateTime(entry.created_at)}
                      </td>
                      <td className="text-text px-5 py-3.5">{entry.actor.email}</td>
                      <td className="text-text px-5 py-3.5">{actionLabel(entry)}</td>
                      <td className="num text-text-muted px-5 py-3.5 text-right whitespace-nowrap">
                        {formatWeight(weightFrom(entry.before_state))}
                      </td>
                      <td className="num text-text px-5 py-3.5 text-right whitespace-nowrap">
                        {formatWeight(weightFrom(entry.after_state))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pageIndex={pageIndex}
              pageCount={pageCount}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPageIndex}
            />
          </>
          </SectionErrorBoundary>
        )}
      </Card>
    </div>
  );
}
