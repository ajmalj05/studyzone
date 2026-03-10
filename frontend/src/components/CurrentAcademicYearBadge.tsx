import { useAcademicYear } from "@/context/AcademicYearContext";
import { cn } from "@/lib/utils";

/**
 * Non-editable badge showing the current academic year. Used in the top-right of admin pages.
 * Data remains filtered by the context's selectedYearId (current year).
 */
export function CurrentAcademicYearBadge({ className }: { className?: string }) {
  const { currentYear, loading } = useAcademicYear();

  return (
    <span
      role="status"
      aria-label={currentYear ? `Current academic year: ${currentYear.name}` : "No academic year set"}
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground cursor-default select-none",
        className
      )}
    >
      {loading ? (
        "…"
      ) : currentYear ? (
        currentYear.name
      ) : (
        "No academic year set"
      )}
    </span>
  );
}
