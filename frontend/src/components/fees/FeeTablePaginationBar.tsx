import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FEE_UI_PAGE_SIZE, feePageCount } from "@/lib/feeListPagination";
import { FeePaginationNumbers } from "./FeePaginationNumbers";

interface FeeTablePaginationBarProps {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  className?: string;
}

export function FeeTablePaginationBar({
  page,
  total,
  onPageChange,
  pageSize = FEE_UI_PAGE_SIZE,
  className,
}: FeeTablePaginationBarProps) {
  const pages = feePageCount(total, pageSize);
  if (total <= pageSize) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div
      className={
        className ??
        "flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-600"
      }
    >
      <span className="tabular-nums shrink-0">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <FeePaginationNumbers
          currentPage={page}
          totalPages={pages}
          onPageChange={onPageChange}
          variant="default"
          className="justify-end"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
