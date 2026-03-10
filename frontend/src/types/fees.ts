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
  charges: { id: string; period: string; amount: number; description?: string; particularName?: string }[];
  payments: { id: string; amount: number; receiptNumber: string; paidAt: string; mode: string }[];
}

export interface AddAdmissionFeeResult {
  chargeId: string;
  paymentId?: string | null;
  receiptNumber?: string | null;
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
  academicYearId?: string;
  academicYearName?: string;
  classId?: string;
  batchId?: string;
  batchName?: string;
  section?: string;
  status?: string;
}

export interface BatchDto {
  id: string;
  classId: string;
  className: string;
  academicYearId?: string;
  name: string;
  section?: string;
  seatLimit?: number;
}

export const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export interface FeeReceiptParticularDto {
  name: string;
  amount: number;
}

export interface FeeReceiptHistoryItemDto {
  paymentId: string;
  receiptNumber: string;
  submissionDate: string;
  feeTerm?: string | null;
  totalAmount: number;
  deposit: number;
  due: number;
}

export interface FeeReceiptDto {
  paymentId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  guardianName?: string | null;
  className?: string | null;
  receiptNumber: string;
  paidAt: string;
  feeTerm?: string | null;
  currencySymbol?: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  deposit: number;
  remainingBalance: number;
  particulars: FeeReceiptParticularDto[];
  history: FeeReceiptHistoryItemDto[];
}
