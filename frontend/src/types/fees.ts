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

export interface FeeLedgerDto {
  studentId: string;
  studentName: string;
  className?: string;
  feePaymentStartMonth?: number;
  feePaymentStartYear?: number;
  totalCharges: number;
  totalPayments: number;
  balance: number;
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