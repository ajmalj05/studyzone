import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { feePaginationPageItems } from "@/lib/feeListPagination";

interface FeePaginationNumbersProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Table bar vs compact modal footer */
  variant?: "default" | "compact";
  className?: string;
}

export function FeePaginationNumbers({
  currentPage,
  totalPages,
  onPageChange,
  variant = "default",
  className,
}: FeePaginationNumbersProps) {
  if (totalPages <= 1) return null;

  const items = feePaginationPageItems(currentPage, totalPages);
  const compact = variant === "compact";

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-0.5", className)}>
      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className={cn(
              "inline-flex items-center justify-center text-muted-foreground select-none",
              compact ? "h-7 min-w-6 px-0.5 text-xs" : "h-8 min-w-7 px-1 text-sm"
            )}
            aria-hidden
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={currentPage === item ? "default" : "outline"}
            size="sm"
            className={cn(
              "shrink-0 p-0 tabular-nums",
              compact ? "h-7 min-w-7 text-xs" : "h-8 min-w-8 text-sm"
            )}
            aria-current={currentPage === item ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        )
      )}
    </div>
  );
}
