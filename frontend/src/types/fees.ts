export interface FeeStructureDto {
  id: string;
  classId: string;
  className: string;
  academicYearId?: string;
  academicYearName?: string;
  name: string;
  amount: number;
  frequency: string;
}

export const FEE_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface FeeLedgerDto {
  studentId: string;
  studentName: string;
  className?: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  feePaymentStartMonth?: number;
  feePaymentStartYear?: number;
  charges: { id: string; period: string; amount: number }[];
  payments: { id: string; amount: number; receiptNumber: string; paidAt: string; mode: string }[];
}

export interface PaymentDto {
  id: string;
  amount: number;
  receiptNumber: string;
  paidAt: string;
  mode: string;
}

export interface ClassDto {
  id: string;
  name: string;
}

export interface StudentDto {
  id: string;
  name: string;
  admissionNumber: string;
  className?: string;
}

export const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;
