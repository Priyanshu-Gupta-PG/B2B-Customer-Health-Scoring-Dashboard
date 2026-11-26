"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ListTodo } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { useAuth } from "@/features/auth/AuthProvider";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import type { HealthStatus } from "@/types/api";
import { useCompletePlaybook, usePlaybooks } from "./hooks";
import { toast } from "@/components/ui/toast";

const PAGE_SIZE = 25;

export function PlaybooksView() {
  const { isAdmin } = useAuth();
  const [pageIndex, setPageIndex] = useState(0);
  const [status, setStatus] = useState<"open" | "done" | "">("open");
  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: pageIndex * PAGE_SIZE,
      ...(status ? { status } : {}),
    }),
    [pageIndex, status],
  );
  const query = usePlaybooks(params);
  const complete = useCompletePlaybook();

  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playbooks"
        description="Automated CSM outreach tasks created when an account score drops below 40."
        actions={
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "open" | "done" | "");
              setPageIndex(0);
            }}
            className="w-36"
          >
            <option value="open">Open</option>
            <option value="done">Done</option>
            <option value="">All</option>
          </Select>
        }
      />

      <SectionErrorBoundary title="Playbook tasks">
        {query.isPending ? (
          <Card>
            <TableSkeleton rows={6} cols={5} />
          </Card>
        ) : query.isError ? (
          <Card>
            <ErrorState
              title="Failed to load playbooks"
              message={errorMessage(query.error)}
              onRetry={() => void query.refetch()}
              retrying={query.isFetching}
            />
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ListTodo className="size-6" />}
              title="No playbook tasks"
              description="Tasks appear automatically when recalculation drops an account below score 40."
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((task) => (
                    <tr key={task.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/accounts/${task.account_id}`} className="font-medium text-text hover:text-blue-300">
                          {task.company_name}
                        </Link>
                        <div className="mt-0.5">
                          <StatusBadge status={task.health_status as HealthStatus} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-text">{task.title}</div>
                        <div className="mt-0.5 text-xs text-text-muted">{task.reason}</div>
                      </td>
                      <td className="px-4 py-3 num font-semibold">{task.score}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">{formatDateTime(task.created_at)}</td>
                      <td className="px-4 py-3 text-xs capitalize text-text-muted">{task.status}</td>
                      <td className="px-4 py-3 text-right">
                        {task.status === "open" && isAdmin ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1.5"
                            loading={complete.isPending && complete.variables === task.id}
                            onClick={() => {
                              complete.mutate(task.id, {
                                onSuccess: () => toast.success("Playbook task marked done."),
                                onError: (err) => toast.error(errorMessage(err)),
                              });
                            }}
                          >
                            <CheckCircle2 className="size-3.5" />
                            Complete
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/[0.06] px-4 py-3">
              <Pagination
                pageIndex={pageIndex}
                pageCount={pageCount}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPageIndex}
              />
            </div>
          </Card>
        )}
      </SectionErrorBoundary>
    </div>
  );
}
