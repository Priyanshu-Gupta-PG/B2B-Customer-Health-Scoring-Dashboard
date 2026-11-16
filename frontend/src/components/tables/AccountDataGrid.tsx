"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Search } from "lucide-react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createCoreRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equals,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type { AccountSummary, HealthStatus } from "@/types/api";
import { ALL_STATUSES, STATUS_ORDER, scoreTextClass } from "@/lib/status";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";

const EMPTY_DATA: AccountSummary[] = [];

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  coreRowModel: createCoreRowModel(),
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

const helper = createColumnHelper<typeof features, AccountSummary>();

const columns = helper.columns([
  helper.accessor("company_name", {
    header: "Account Name",
    cell: (info) => {
      const name = info.getValue();
      const initials = name
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      return (
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-raised border border-white/[0.08] text-[11px] font-medium text-text-muted">
            {initials}
          </span>
          <span className="font-medium text-text group-hover:text-white transition-colors">{name}</span>
        </div>
      );
    },
  }),
  helper.accessor("current_score", {
    header: "Health Score",
    sortDescFirst: false,
    cell: (info) => {
      const score = info.getValue();
      const barColor =
        score <= 30 ? "bg-rose-500" : score <= 70 ? "bg-amber-400" : "bg-emerald-500";
      return (
        <div className="flex items-center gap-2.5">
          <span className={`num text-sm font-semibold w-7 ${scoreTextClass(score)}`}>{score}</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      );
    },
  }),
  helper.accessor("health_status", {
    header: "Status",
    filterFn: filterFn_equals,
    enableGlobalFilter: false,
    sortFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue<HealthStatus>(columnId);
      const b = rowB.getValue<HealthStatus>(columnId);
      return STATUS_ORDER[a] - STATUS_ORDER[b];
    },
    cell: (info) => <StatusBadge status={info.getValue()} size="sm" />,
  }),
  helper.accessor("arr", {
    header: "ARR",
    enableGlobalFilter: false,
    cell: (info) => <span className="num text-sm text-text font-medium">{formatCurrency(info.getValue())}</span>,
  }),
  helper.accessor("last_active_at", {
    header: "Last Active",
    enableGlobalFilter: false,
    sortUndefined: "last",
    cell: (info) => <span className="text-xs text-text-muted">{formatDate(info.getValue())}</span>,
  }),
  helper.display({
    id: "actions",
    header: "Action",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-end">
        <Link
          href={`/accounts/${row.original.id}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>Open</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    ),
  }),
]);

function parseStatusParam(value: string | null): HealthStatus | "" {
  if (value === "Critical" || value === "At-Risk" || value === "Healthy") return value;
  return "";
}

export function AccountDataGrid({
  data,
  isLoading = false,
  isError = false,
  onRetry,
}: {
  data: AccountSummary[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFromUrl = parseStatusParam(searchParams.get("status"));

  const table = useTable({
    features,
    columns,
    data: isLoading ? EMPTY_DATA : data,
    getRowId: (row) => row.id,
    globalFilterFn: filterFn_includesString,
    getColumnCanGlobalFilter: (column) => column.id === "company_name",
    initialState: {
      pagination: { pageIndex: 0, pageSize: 25 },
      sorting: [{ id: "current_score", desc: false }],
      columnFilters: statusFromUrl ? [{ id: "health_status", value: statusFromUrl }] : [],
    },
  });

  // Keep table filter in sync with ?status= deep links (dashboard → accounts).
  useEffect(() => {
    const column = table.getColumn("health_status");
    const current = (column?.getFilterValue() as HealthStatus | undefined) ?? "";
    if (current !== statusFromUrl) {
      column?.setFilterValue(statusFromUrl || undefined);
      table.setPageIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from URL only
  }, [statusFromUrl]);

  const search = typeof table.state.globalFilter === "string" ? table.state.globalFilter : "";
  const statusFilter = (table.getColumn("health_status")?.getFilterValue() as HealthStatus | undefined) ?? "";
  const pageIndex = table.state.pagination.pageIndex;
  const pageSize = table.state.pagination.pageSize;
  const filteredCount = table.getPrePaginatedRowModel().rows.length;
  const pageCount = table.getPageCount();
  const rows = table.getRowModel().rows;

  const setStatusFilter = (value: string) => {
    table.getColumn("health_status")?.setFilterValue(value ? (value as HealthStatus) : undefined);
    table.setPageIndex(0);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    const query = params.toString();
    router.replace(query ? `/accounts?${query}` : "/accounts", { scroll: false });
  };

  return (
    <Card className="animate-fade-in-up">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] bg-white/[0.01] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <Input
              id="account-search"
              label="Search portfolio"
              placeholder="Search by company name..."
              value={search}
              onChange={(event) => {
                table.setGlobalFilter(event.target.value);
                table.setPageIndex(0);
              }}
              leading={<Search className="size-4" />}
              disabled={isLoading || isError}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              id="account-status"
              label="Health band"
              value={statusFilter}
              disabled={isLoading || isError}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All tiers</option>
              {ALL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="text-xs text-text-muted self-start sm:self-end pb-1.5">
          <span className="num text-text font-semibold">{formatNumber(filteredCount)}</span>
          <span> of </span>
          <span className="num">{formatNumber(data.length)}</span>
          <span> accounts</span>
          {statusFilter ? (
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className="ml-2 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              Clear filter
            </button>
          ) : null}
        </div>
      </div>

      {isError ? (
        <ErrorState title="Failed to load accounts" onRetry={onRetry} />
      ) : isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No accounts match your filter criteria."
          action={
            statusFilter || search ? (
              <button
                type="button"
                className="text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
                onClick={() => {
                  table.setGlobalFilter("");
                  setStatusFilter("");
                }}
              >
                Reset search and filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto max-h-[min(70vh,44rem)]">
          <table className="table-sticky-head w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="border-b border-white/[0.06] text-[11px] font-medium uppercase tracking-wider text-text-muted">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const sortable = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th key={header.id} className="px-5 py-3.5 font-medium" aria-sort={ariaSort(sorted)}>
                        {header.isPlaceholder ? null : sortable ? (
                          <button
                            type="button"
                            className="group inline-flex items-center gap-1.5 text-left hover:text-white transition-colors cursor-pointer select-none"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <table.FlexRender header={header} />
                            <SortIcon direction={sorted} />
                          </button>
                        ) : (
                          <table.FlexRender header={header} />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  tabIndex={0}
                  className="group cursor-pointer transition-colors duration-150 hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30"
                  onClick={() => router.push(`/accounts/${row.original.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/accounts/${row.original.id}`);
                    }
                  }}
                >
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-3.5">
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isError && !isLoading && (
        <Pagination
          pageIndex={pageIndex}
          pageCount={pageCount}
          pageSize={pageSize}
          total={filteredCount}
          onPageChange={(index) => table.setPageIndex(index)}
          onPageSizeChange={(size) => table.setPageSize(size)}
        />
      )}
    </Card>
  );
}

function ariaSort(direction: false | "asc" | "desc"): "ascending" | "descending" | "none" {
  if (direction === "asc") return "ascending";
  if (direction === "desc") return "descending";
  return "none";
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="size-3 text-blue-400" aria-hidden />;
  if (direction === "desc") return <ArrowDown className="size-3 text-blue-400" aria-hidden />;
  return <ArrowUpDown className="size-3 text-text-muted/50 group-hover:text-text-muted" aria-hidden />;
}
