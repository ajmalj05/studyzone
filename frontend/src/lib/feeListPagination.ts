/** Page size for fee management tables and Add Fee modal lists. */
export const FEE_UI_PAGE_SIZE = 10;

export function feePageCount(total: number, pageSize = FEE_UI_PAGE_SIZE): number {
  if (total <= 0) return 1;
  return Math.ceil(total / pageSize);
}

export function feeSlicePage<T>(items: readonly T[], page: number, pageSize = FEE_UI_PAGE_SIZE): T[] {
  const p = Math.max(1, page);
  const start = (p - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function feeClampPage(page: number, total: number, pageSize = FEE_UI_PAGE_SIZE): number {
  const max = feePageCount(total, pageSize);
  return Math.min(Math.max(1, page), max);
}

export type FeePaginationItem = number | "ellipsis";

/**
 * Compact page strip: page 1 → `1 2 … last`; page 2 → `1 2 3 … last`; middle → `1 … c-1 c c+1 … last`;
 * last pages mirror the start. Few total pages → show all. Ellipsis only when there is a real gap.
 */
export function feePaginationPageItems(currentPage: number, totalPages: number): FeePaginationItem[] {
  if (totalPages <= 0) return [];
  const c = Math.min(Math.max(1, currentPage), totalPages);

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const nums = new Set<number>();
  nums.add(1);
  nums.add(totalPages);

  if (c === 1) {
    nums.add(2);
  } else if (c === 2) {
    nums.add(2);
    nums.add(3);
  } else if (c === totalPages) {
    nums.add(totalPages - 1);
  } else if (c === totalPages - 1) {
    nums.add(totalPages - 2);
    nums.add(totalPages - 1);
  } else {
    nums.add(c - 1);
    nums.add(c);
    nums.add(c + 1);
  }

  const sorted = [...nums].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out: FeePaginationItem[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev > 0 && n > prev + 1) out.push("ellipsis");
    out.push(n);
    prev = n;
  }
  return out;
}
