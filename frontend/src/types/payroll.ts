export interface TeacherSalaryPaymentLineDto {
  id: string;
  lineType: string;
  description: string;
  amount: number;
}

export interface TeacherSalaryPaymentDto {
  id: string;
  teacherUserId: string;
  teacherName?: string;
  year: number;
  month: number;
  baseAmount: number;
  totalAdditions: number;
  totalDeductions: number;
  netAmount: number;
  status: string;
  paidAt?: string;
  notes?: string;
  lines: TeacherSalaryPaymentLineDto[];
}

export interface TeacherSalaryDto {
  id: string;
  teacherUserId: string;
  teacherName?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  amount: number;
  payFrequency: string;
  currency: string;
  notes?: string;
  createdAt: string;
}

export interface TeacherDto {
  id: string;
  name: string;
}

export interface StaffSalaryPaymentLineDto {
  id: string;
  lineType: string;
  description: string;
  amount: number;
}

export interface StaffSalaryPaymentDto {
  id: string;
  staffUserId: string;
  staffName?: string;
  year: number;
  month: number;
  baseAmount: number;
  totalAdditions: number;
  totalDeductions: number;
  netAmount: number;
  status: string;
  paidAt?: string;
  notes?: string;
  lines: StaffSalaryPaymentLineDto[];
}

export interface StaffSalaryDto {
  id: string;
  staffUserId: string;
  staffName?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  amount: number;
  payFrequency: string;
  currency: string;
  notes?: string;
  createdAt: string;
}

export interface StaffDto {
  id: string;
  name: string;
}

export const PAYROLL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const currentPayrollDate = new Date();

export function payrollMonthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString("en", { month: "short" });
}

export function formatPayrollCurrency(amount: number) {
  return `AED ${Number(amount).toLocaleString("en-AE")}`;
}

