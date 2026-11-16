import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./Button";

export function Pagination({
  pageIndex,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizes = [10, 25, 50, 100],
}: {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (index: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizes?: number[];
}) {
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);
  return (
    <div className="border-border text-text-muted flex flex-col gap-3 border-t px-5 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="num text-text">{from}</span>–
          <span className="num text-text">{to}</span> of{" "}
          <span className="num text-text">{total}</span>
        </span>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5">
            Rows
            <select
              className="border-border bg-bg text-text h-7 rounded-md border px-1.5 text-xs"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(0)}
          disabled={pageIndex === 0}
          aria-label="First page"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 0}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-2">
          Page <span className="num text-text">{pageCount === 0 ? 0 : pageIndex + 1}</span> of{" "}
          <span className="num text-text">{pageCount}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(pageCount - 1)}
          disabled={pageIndex >= pageCount - 1}
          aria-label="Last page"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
