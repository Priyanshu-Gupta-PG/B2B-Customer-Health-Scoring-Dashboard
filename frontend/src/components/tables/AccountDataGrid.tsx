"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import {
  columnFilteringFeature,
  createColumnHelper,
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
import { formatCurrency, formatDate } from "@/lib/format";
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
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

const helper = createColumnHelper<typeof features, AccountSummary>();

const columns = helper.columns([
  helper.accessor("company_name", {
    header: "Account Name",
    cell: (info) => <span className="font-medium text-text">{info.getValue()}</span>,
  }),
  helper.accessor("current_score", {
    header: "Current Health Score",
    sortDescFirst: false,
    cell: (info) => {
      const score = info.getValue();
      return <span className={`num text-sm font-semibold ${scoreTextClass(score)}`}>{score}</span>;
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
    cell: (info) => <span className="num text-sm text-text">{formatCurrency(info.getValue())}</span>,
  }),
  helper.accessor("last_active_at", {
    header: "Last Active Date",
    enableGlobalFilter: false,
    sortUndefined: "last",
    cell: (info) => <span className="text-sm text-text-muted">{formatDate(info.getValue())}</span>,
  }),
  helper.display({
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/accounts/${row.original.id}`}
        onClick={(event) => event.stopPropagation()}
        className="text-xs font-medium text-blue-300 hover:text-blue-200 hover:underline"
      >
        View Details
      </Link>
    ),
  }),
]);

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
    },
  });

  const search = typeof table.state.globalFilter === "string" ? table.state.globalFilter : "";
  const statusFilter = (table.getColumn("health_status")?.getFilterValue() as HealthStatus | undefined) ?? "";
  const pageIndex = table.state.pagination.pageIndex;
  const pageSize = table.state.pagination.pageSize;
  const filteredCount = table.getRowCount();
  const pageCount = table.getPageCount();
  const rows = table.getRowModel().rows;

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <Input
            id="account-search"
            label="Search"
            placeholder="Search by account name"
            value={search}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            leading={<Search className="size-4" />}
            disabled={isLoading || isError}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            id="account-status"
            label="Status"
            value={statusFilter}
            disabled={isLoading || isError}
            onChange={(event) => {
              const value = event.target.value;
              table.getColumn("health_status")?.setFilterValue(value ? (value as HealthStatus) : undefined);
            }}
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isError ? (
        <ErrorState title="Failed to load accounts" onRetry={onRetry} />
      ) : isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState title="No accounts match your filter criteria." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="border-b border-border bg-surface-raised/50 text-xs uppercase tracking-wide text-text-muted">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const sortable = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th key={header.id} className="px-5 py-3 font-medium" aria-sort={ariaSort(sorted)}>
                        {header.isPlaceholder ? null : sortable ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-left hover:text-text"
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
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  tabIndex={0}
                  className="cursor-pointer transition-colors hover:bg-surface-raised/70 focus-visible:bg-surface-raised/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
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
  if (direction === "asc") return <ArrowUp className="size-3.5 text-blue-300" aria-hidden />;
  if (direction === "desc") return <ArrowDown className="size-3.5 text-blue-300" aria-hidden />;
  return <ArrowUpDown className="size-3.5 text-text-muted/70" aria-hidden />;
}
