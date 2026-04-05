// Fee Management Types

export interface TuitionFee {
  id: string;
  classId: string;
  className: string;
  amount: number;
  frequency: 'Monthly' | 'Per term' | 'Annual';
  status: 'Active' | 'Draft' | 'Inactive';
  effectiveFrom?: string;
}

export interface AdmissionFee {
  id: string;
  classId: string;
  className: string;
  amount: number;
  chargedWhen: 'On enrollment' | 'On admission';
  status: 'Active' | 'Draft' | 'Inactive';
}

export interface BusFee {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  amount: number;
  routeNote?: string;
  frequency: 'Monthly' | 'Per term';
  status: 'Active' | 'Draft' | 'Inactive';
  effectiveFrom?: string;
}

export interface StudentBillingRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  batch?: string;
  charged: number;
  paid: number;
  balance: number;
  status: 'Paid' | 'Unpaid' | 'Partial' | 'No fees';
}

export interface StudentCharge {
  id: string;
  feeType: 'Tuition' | 'Bus' | 'Admission' | 'Manual';
  month?: string;
  amount: number;
  paid: number;
  balance: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  mode: string;
  receiptNumber: string;
  paidAt: string;
  reference?: string | null;
  /** Tuition, Bus, Admission, Manual, or null/omitted for general (all-outstanding) payments */
  feeType?: string | null;
}

export interface PaymentHistoryRecord {
  id: string;
  date: string;
  feeType: string;
  amount: number;
  mode: string;
  reference?: string;
  receipt?: string;
}

export interface FeeReceiptDto {
  id: string;
  receiptNumber: string;
  studentName: string;
  admissionNumber?: string;
  guardianName?: string;
  className?: string;
  feeTerm?: string;
  paidAt?: string;
  totalCharges: number;
  deposit: number;
  remainingBalance: number;
  currencySymbol?: string;
  particulars?: { name: string; amount: number }[];
}

export interface ClassDto {
  id: string;
  name: string;
}

export interface StudentDto {
  id: string;
  name: string;
  admissionNumber: string;
  classId: string;
  className?: string;
  batchId?: string;
  batchName?: string;
}

export interface BatchDto {
  id: string;
  name: string;
  classId: string;
}

export interface StudentFeeOfferDto {
  id: string;
  studentId: string;
  studentName: string;
  className?: string;
  academicYearId: string;
  offerType: 'PercentageDiscount' | 'FixedDiscount';
  value: number;
  reason?: string;
}

/** Charge line as returned by GET /Fees/ledger/{studentId} */
export interface FeeLedgerChargeDto {
  id: string;
  period: string;
  amount: number;
  paid?: number;
  balance?: number;
  particularName?: string;
  description?: string;
}

/** Payment line as returned by GET /Fees/ledger/{studentId} */
export interface FeeLedgerPaymentDto {
  id: string;
  amount: number;
  mode: string;
  receiptNumber: string;
  paidAt: string;
  reference?: string | null;
  feeType?: string | null;
}

export interface FeeLedgerDto {
  studentId: string;
  studentName: string;
  className?: string;
  feePaymentStartMonth?: number;
  feePaymentStartYear?: number;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  charges?: FeeLedgerChargeDto[];
  payments?: FeeLedgerPaymentDto[];
}

export const FEE_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTHS_2026 = [
  'April 2026', 'March 2026', 'February 2026', 'January 2026',
  'December 2025', 'November 2025', 'October 2025', 'September 2025',
  'August 2025', 'July 2025', 'June 2025', 'May 2025'
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const FEE_LINE_EPS = 0.01;

function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalizes amount / paid / balance from GET /Fees/ledger charge rows (camelCase or legacy PascalCase).
 * Fixes inconsistent rows where balance is ~0 but nothing was paid toward a non-zero charge (shows as Unpaid with balance = amount).
 */
export function normalizeLedgerChargeAmounts(c: {
  amount?: unknown;
  paid?: unknown;
  balance?: unknown;
  Paid?: unknown;
  Balance?: unknown;
  Amount?: unknown;
}): { amount: number; paid: number; balance: number } {
  const amount = parseMoney(c.amount ?? c.Amount) ?? 0;
  const paid = parseMoney(c.paid ?? c.Paid) ?? 0;
  const balRaw = parseMoney(c.balance ?? c.Balance);
  let balance = balRaw != null ? Math.max(0, balRaw) : Math.max(0, amount - paid);
  const impliedOutstanding = Math.max(0, amount - paid);
  // Row inconsistent (e.g. balance 0 while amount > paid); trust amount − paid for display/status.
  if (amount > FEE_LINE_EPS && Math.abs(impliedOutstanding - balance) > FEE_LINE_EPS) {
    balance = impliedOutstanding;
  }
  return { amount, paid, balance };
}

/** Per-line status for a charge; uses small epsilon so rounding and API quirks do not mark unpaid lines as Paid. */
export function ledgerChargeStatus(amount: number, paid: number, balance: number): StudentCharge['status'] {
  if (amount <= FEE_LINE_EPS) return 'Paid';
  if (balance <= FEE_LINE_EPS && paid + FEE_LINE_EPS >= amount) return 'Paid';
  if (paid > FEE_LINE_EPS) return 'Partial';
  return 'Unpaid';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Active':
    case 'Paid':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Draft':
    case 'Partial':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Unpaid':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'Inactive':
    case 'No fees':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export function getStatusDotColor(status: string): string {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-500';
    case 'Partial':
      return 'bg-amber-500';
    case 'Unpaid':
      return 'bg-rose-500';
    default:
      return 'bg-slate-400';
  }
}