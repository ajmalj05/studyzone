import * as React from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

// Badge variant types
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "amber" | "violet" | "emerald" | "indigo";


// Interface for column configuration
export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  badge?: (row: T) => { label: string; variant: BadgeVariant } | null;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
}

// Props for the DataTable component
export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  emptyDescription?: string;
  loading?: boolean;
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  onRowClick?: (row: T) => void;
  maxHeight?: string;
}

// Badge component with all color variants
function DataTableBadge({ label, variant }: { label: string; variant: BadgeVariant }) {
  const variantClasses: Record<BadgeVariant, string> = {
    default: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
    secondary: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
    destructive: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    outline: "bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-600",
    success: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    warning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    info: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    amber: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    violet: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border",
        variantClasses[variant]
      )}
    >
      {label}
    </span>
  );
}

// Empty state component
function EmptyState({ message, description }: { message: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <Inbox className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{message}</p>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
      )}
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin" />
    </div>
  );
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "No data found",
  emptyDescription,
  loading = false,
  className,
  headerClassName,
  rowClassName,
  onRowClick,
  maxHeight,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn("rounded-[14px] border border-slate-200 bg-white shadow-sm", className)}>
        <LoadingState />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn("rounded-[14px] border border-slate-200 bg-white shadow-sm", className)}>
        <EmptyState message={emptyMessage} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm", className)}>
      <div className={cn("overflow-x-auto", maxHeight && "overflow-y-auto")} style={maxHeight ? { maxHeight } : undefined}>
        <table className="w-full text-sm">
          <thead>
            <tr className={cn("border-b border-slate-200 bg-slate-50", headerClassName)}>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500",
                    index === 0 && "rounded-tl-[14px]",
                    index === columns.length - 1 && "rounded-tr-[14px]",
                    column.align === "center" && "text-center",
                    column.align === "right" && "w-px whitespace-nowrap text-right",
                    column.align === "left" && "text-left",
                    !column.align && "text-left",
                    column.headerClassName
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  "border-b border-slate-200/80 last:border-0 transition-colors hover:bg-slate-50",
                  onRowClick && "cursor-pointer",
                  rowClassName
                )}
                onClick={() => onRowClick?.(row)}
              >

                {columns.map((column) => {
                  const badgeData = column.badge?.(row);
                  const content = badgeData ? (
                    <DataTableBadge label={badgeData.label} variant={badgeData.variant} />
                  ) : (
                    column.cell?.(row) ?? null
                  );

                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3",
                        column.align === "center" && "text-center",
                        column.align === "right" && "w-px whitespace-nowrap text-right",
                        column.align === "left" && "text-left",
                        !column.align && "text-left",
                        column.className
                      )}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper function to create a simple text column
export function textColumn<T>(key: string, header: string, getter: (row: T) => string, options?: { className?: string; align?: "left" | "center" | "right" }): DataTableColumn<T> {
  return {
    key,
    header,
    cell: (row) => <span className="text-slate-700 dark:text-slate-200">{getter(row) || "—"}</span>,
    ...options,
  };
}

// Helper function to create a badge column
export function badgeColumn<T>(key: string, header: string, getter: (row: T) => { label: string; variant: BadgeVariant } | null): DataTableColumn<T> {
  return {
    key,
    header,
    cell: () => null,
    badge: getter,
  };
}

// Helper function to create an actions column
export function actionsColumn<T>(key: string, renderActions: (row: T) => React.ReactNode): DataTableColumn<T> {
  return {
    key,
    header: "",
    cell: renderActions,
    align: "right",
    className: "w-[100px]",
  };
}