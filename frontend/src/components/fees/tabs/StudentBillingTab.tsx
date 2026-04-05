import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, Search, Check, CreditCard, ArrowLeft, FileText, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentBillingRecord, ClassDto, StudentDto, StudentCharge, PaymentHistoryRecord, FeeReceiptDto, getInitials, getStatusColor, formatCurrency, getStatusDotColor, FEE_MONTH_NAMES, normalizeLedgerChargeAmounts, ledgerChargeStatus } from "@/types/fees";
import { GenerateOutstandingModal } from "../modals/GenerateOutstandingModal";
import { RecordPaymentModal } from "../modals/RecordPaymentModal";
import { QuickPayModal } from "../modals/QuickPayModal";
import { ManualChargeModal } from "../modals/ManualChargeModal";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import { buildReceiptHtml, buildReportHtml, SchoolProfileForReceipt } from "@/lib/receiptHtml";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAcademicYear } from "@/context/AcademicYearContext";

interface StudentBillingTabProps {
  classes: ClassDto[];
  students: StudentDto[];
}

export function StudentBillingTab({ classes, students }: StudentBillingTabProps) {
  const { selectedYearId } = useAcademicYear();
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedStudent, setSelectedStudent] = useState<StudentBillingRecord | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [quickPayOpen, setQuickPayOpen] = useState(false);
  const [quickPayData, setQuickPayData] = useState<{studentId: string; studentName: string; admissionNumber: string; balance: number} | null>(null);
  const [manualChargeOpen, setManualChargeOpen] = useState(false);
  
  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ type: 'charge'; id: string; name: string } | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const [billingRecords, setBillingRecords] = useState<StudentBillingRecord[]>([]);
  const [charges, setCharges] = useState<StudentCharge[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRecord[]>([]);

  // Load billing data on mount
  useEffect(() => {
    loadBillingData();
  }, [selectedYearId]);

  const loadBillingData = async () => {
    try {
      // Load ALL students with fee data (not just outstanding)
      const data = await fetchApi(`/Fees/outstanding?academicYearId=${selectedYearId || ""}`) as Array<{
        studentId: string;
        studentName: string;
        className?: string;
        totalCharges: number;
        totalPayments: number;
        balance: number;
      }>;
      
      // Transform the data to StudentBillingRecord format
      // Include ALL students, not just those with outstanding balance
      // Try to find matching student to get classId
      const records: StudentBillingRecord[] = data.map(s => {
        // Find the student in the students list to get proper class info
        const studentInfo = students.find(st => st.id === s.studentId);
        
        return {
          id: s.studentId,
          studentId: s.studentId,
          studentName: s.studentName,
          admissionNumber: studentInfo?.admissionNumber || "",
          classId: studentInfo?.classId || "",
          className: s.className || studentInfo?.className || "—",
          batch: studentInfo?.batchName || "",
          charged: s.totalCharges,
          paid: s.totalPayments,
          balance: s.balance,
          status: s.balance === 0 ? "Paid" : s.balance > 0 && s.totalPayments > 0 ? "Partial" : "Unpaid"
        };
      });
      
      setBillingRecords(records);
    } catch (e) {
      console.error("Failed to load billing data:", e);
      setBillingRecords([]);
    }
  };

  // Load student detail data when viewing a student
  useEffect(() => {
    if (selectedStudent) {
      loadStudentDetailData(selectedStudent.studentId);
    }
  }, [selectedStudent]);

  const loadStudentDetailData = async (studentId: string): Promise<number | null> => {
    try {
      // Load ledger to get charges and payments
      const ledger = await fetchApi(`/Fees/ledger/${studentId}`) as {
        balance?: number;
        charges: Array<{
          id: string;
          period: string;
          amount: number;
          paid: number;
          balance: number;
          particularName?: string;
        }>;
        payments: Array<{
          id: string;
          paidAt: string;
          amount: number;
          mode: string;
          receiptNumber: string;
          feeType?: string | null;
        }>;
      };
      
      // Transform charges (use ?? so balance 0 from API is not replaced by amount)
      const chargesData: StudentCharge[] = (ledger.charges || []).map(c => {
        const particularLower = (c.particularName || "").toLowerCase();
        let feeType: "Tuition" | "Bus" | "Admission" | "Manual" = "Manual";
        if (particularLower.includes("tuition")) feeType = "Tuition";
        else if (particularLower.includes("bus")) feeType = "Bus";
        else if (particularLower.includes("admission")) feeType = "Admission";

        const { amount, paid, balance } = normalizeLedgerChargeAmounts(c);

        return {
          id: c.id,
          feeType: feeType,
          month: c.period,
          amount,
          paid,
          balance,
          status: ledgerChargeStatus(amount, paid, balance)
        };
      });
      setCharges(chargesData);
      
      // Transform payments
      const paymentsData: PaymentHistoryRecord[] = (ledger.payments || []).map(p => ({
        id: p.id,
        date: new Date(p.paidAt).toISOString().split('T')[0],
        feeType: p.feeType?.trim() ? p.feeType.trim() : "General",
        amount: p.amount,
        mode: p.mode,
        reference: p.receiptNumber
      }));
      setPaymentHistory(paymentsData);

      return typeof ledger.balance === "number" ? ledger.balance : null;
    } catch (e) {
      console.error("Failed to load student detail:", e);
      setCharges([]);
      setPaymentHistory([]);
      return null;
    }
  };

  const filteredRecords = billingRecords.filter(record => {
    if (searchTerm && !record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !record.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (classFilter && record.classId !== classFilter) return false;
    if (statusFilter && record.status !== statusFilter) return false;
    return true;
  });

  const activeFilters = [
    classFilter && classes.find(c => c.id === classFilter)?.name,
    statusFilter,
  ].filter(Boolean);

  const handleGenerateOutstanding = async (data: {
    classId: string;
    month: string;
    includeTuition: boolean;
    includeBus: boolean;
    includeAdmission: boolean;
  }) => {
    try {
      // The backend has /Fees/generate-charges for individual students
      // We need to get all students in the class and generate charges for each
      const studentsInClass = students.filter(s => s.classId === data.classId);
      
      if (studentsInClass.length === 0) {
        toast({
          title: "No students found",
          description: "No students found in the selected class.",
          variant: "destructive",
        });
        return;
      }

      let totalCharges = 0;
      
      // Generate charges for each student in the class
      for (const student of studentsInClass) {
        try {
          const result = await fetchApi("/Fees/generate-charges", {
            method: "POST",
            body: JSON.stringify({
              studentId: student.id,
              academicYearId: selectedYearId,
              // Convert month string like "April 2026" to year/month
              upToYear: parseInt(data.month.split(' ')[1]),
              upToMonth: FEE_MONTH_NAMES.indexOf(data.month.split(' ')[0]) + 1,
            }),
          }) as { chargesAdded: number };
          
          totalCharges += result.chargesAdded || 0;
        } catch (err) {
          console.error(`Failed to generate charges for ${student.name}:`, err);
          // Continue with other students even if one fails
        }
      }
      
      toast({
        title: "Charges generated",
        description: `Generated ${totalCharges} charge(s) for ${studentsInClass.length} student(s) in the class.`,
      });
      setGenerateModalOpen(false);
      // Refresh the billing data immediately to show new charges
      await loadBillingData();
      
      // If in detail view, refresh the student detail as well
      if (selectedStudent) {
        await loadStudentDetailData(selectedStudent.studentId);
        // Update selectedStudent with fresh data
        const freshData = await fetchApi(`/Fees/ledger/${selectedStudent.studentId}`) as {
          totalCharges: number;
          totalPayments: number;
          balance: number;
        };
        setSelectedStudent(prev => prev ? {
          ...prev,
          charged: freshData.totalCharges,
          paid: freshData.totalPayments,
          balance: freshData.balance,
          status: freshData.balance === 0 ? "Paid" : freshData.balance > 0 && freshData.totalPayments > 0 ? "Partial" : "Unpaid"
        } : null);
      }
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to generate charges",
        variant: "destructive",
      });
    }
  };

  const handleRecordPayment = async (data: {
    studentId: string;
    feeType: string;
    amount: number;
    date: string;
    mode: string;
    reference?: string;
  }) => {
    try {
      await fetchApi("/Fees/payments", {
        method: "POST",
        body: JSON.stringify({
          studentId: data.studentId,
          amount: data.amount,
          mode: data.mode,
          reference: data.reference ?? null,
          feeType: data.feeType === "All outstanding" ? null : data.feeType,
        }),
      });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      setRecordPaymentOpen(false);
      // Refresh the billing data immediately
      await loadBillingData();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const handleQuickPay = async (data: {
    studentId: string;
    feeType: string;
    amount: number;
    date: string;
    mode: string;
    reference?: string;
  }) => {
    try {
      await fetchApi("/Fees/payments", {
        method: "POST",
        body: JSON.stringify({
          studentId: data.studentId,
          amount: data.amount,
          mode: data.mode,
          reference: data.reference ?? null,
          feeType: data.feeType === "All outstanding" ? null : data.feeType,
        }),
      });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      setQuickPayOpen(false);
      setQuickPayData(null);
      
      // Refresh ALL data immediately
      // First refresh billing data to get updated balances
      await loadBillingData();
      
      // Refresh charges for the student who was paid (so QuickPay shows updated amounts)
      await loadStudentDetailData(data.studentId);
      
      // Then refresh detail data if we're in detail view
      if (selectedStudent && selectedStudent.studentId === data.studentId) {
        // Find the updated record from the newly loaded billing records
        // We need to fetch fresh data since billingRecords state is async
        const freshData = await fetchApi(`/Fees/ledger/${selectedStudent.studentId}`) as {
          totalCharges: number;
          totalPayments: number;
          balance: number;
        };
        
        // Update selectedStudent with fresh data
        setSelectedStudent(prev => prev ? {
          ...prev,
          charged: freshData.totalCharges,
          paid: freshData.totalPayments,
          balance: freshData.balance,
          status: freshData.balance === 0 ? "Paid" : freshData.balance > 0 && freshData.totalPayments > 0 ? "Partial" : "Unpaid"
        } : null);
      }
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const handleManualCharge = () => {
    toast({
      title: "Charge added",
      description: "Manual charge added successfully",
    });
    setManualChargeOpen(false);
  };

  const generateStudentReport = async (type: string) => {
    const title = type.includes("filtered") ? "Filtered Students Report" : "All Students Report";
    const studentsToShow = type.includes("filtered") ? filteredRecords : billingRecords;
    
    // Fetch school profile for header
    let school = null;
    try {
      school = await fetchApi("/SchoolProfile").catch(() => null) as SchoolProfileForReceipt | null;
    } catch (e) {
      // Use default
    }
    
    const metaInfo = `
      <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Students:</strong> ${studentsToShow.length}</p>
      ${activeFilters.length > 0 ? `<p><strong>Filters:</strong> ${activeFilters.join(" · ")}</p>` : ''}
    `;
    
    const tableContent = `
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Admission</th>
            <th>Class</th>
            <th class="text-right">Charged (AED)</th>
            <th class="text-right">Paid (AED)</th>
            <th class="text-right">Balance (AED)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${studentsToShow.map(s => `
            <tr>
              <td>${s.studentName}</td>
              <td>${s.admissionNumber}</td>
              <td>${s.className} - ${s.batch}</td>
              <td class="text-right">${s.charged.toLocaleString()}</td>
              <td class="text-right">${s.paid.toLocaleString()}</td>
              <td class="text-right">${s.balance.toLocaleString()}</td>
              <td class="status-${s.status.toLowerCase()}">${s.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    const html = buildReportHtml(title, tableContent, school, metaInfo);
    
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, "_blank");
    
    if (!newWindow) {
      toast({ title: "Popup blocked", description: "Allow popups to view the report.", variant: "destructive" });
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const generateSingleStudentReport = async () => {
    if (!selectedStudent) return;
    
    // Fetch school profile for header
    let school = null;
    try {
      school = await fetchApi("/SchoolProfile").catch(() => null) as SchoolProfileForReceipt | null;
    } catch (e) {
      // Use default
    }
    
    const metaInfo = `
      <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Student:</strong> ${selectedStudent.studentName} (${selectedStudent.admissionNumber})</p>
      <p><strong>Class:</strong> ${selectedStudent.className} - ${selectedStudent.batch}</p>
      <p><strong>Total Charged:</strong> AED ${selectedStudent.charged.toLocaleString()}</p>
      <p><strong>Total Paid:</strong> AED ${selectedStudent.paid.toLocaleString()}</p>
      <p><strong>Balance:</strong> AED ${selectedStudent.balance.toLocaleString()}</p>
    `;
    
    // Charges table
    const chargesContent = charges.length > 0 ? `
      <h2 style="font-size: 1.1rem; margin-top: 20px; margin-bottom: 10px;">Charges</h2>
      <table>
        <thead>
          <tr>
            <th>Fee type</th>
            <th>Month</th>
            <th class="text-right">Amount (AED)</th>
            <th class="text-right">Paid (AED)</th>
            <th class="text-right">Balance (AED)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${charges.map(c => `
            <tr>
              <td>${c.feeType}</td>
              <td>${c.month || "—"}</td>
              <td class="text-right">${c.amount.toLocaleString()}</td>
              <td class="text-right">${c.paid.toLocaleString()}</td>
              <td class="text-right">${c.balance.toLocaleString()}</td>
              <td>${c.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="margin-top: 20px; color: #666;">No charges recorded.</p>';
    
    // Payments table
    const paymentsContent = paymentHistory.length > 0 ? `
      <h2 style="font-size: 1.1rem; margin-top: 20px; margin-bottom: 10px;">Payment History</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Fee type</th>
            <th class="text-right">Amount (AED)</th>
            <th>Mode</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          ${paymentHistory.map(p => `
            <tr>
              <td>${p.date}</td>
              <td>${p.feeType}</td>
              <td class="text-right">${p.amount.toLocaleString()}</td>
              <td>${p.mode}</td>
              <td>${p.reference || "—"}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="margin-top: 20px; color: #666;">No payments recorded.</p>';
    
    const html = buildReportHtml(
      `Student Statement - ${selectedStudent.studentName}`,
      chargesContent + paymentsContent,
      school,
      metaInfo
    );
    
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, "_blank");
    
    if (!newWindow) {
      toast({ title: "Popup blocked", description: "Allow popups to view the report.", variant: "destructive" });
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const handleViewReceipt = async (paymentId: string) => {
    if (!paymentId || printingId) return;
    
    try {
      setPrintingId(paymentId);
      let receipt: FeeReceiptDto | null = null;
      let school: SchoolProfileForReceipt | null = null;
      
      try {
        [receipt, school] = await Promise.all([
          fetchApi(`/Fees/receipt/${encodeURIComponent(paymentId)}`) as Promise<FeeReceiptDto>,
          fetchApi("/SchoolProfile").catch(() => null) as Promise<SchoolProfileForReceipt | null>,
        ]);
      } catch (apiErr) {
        // If API fails (e.g., mock data), generate a demo receipt
        console.log("API failed, showing demo receipt");
      }

      // If no receipt from API, create a demo one for testing
      if (!receipt) {
        const payment = paymentHistory.find(p => p.id === paymentId);
        if (payment) {
          receipt = {
            id: paymentId,
            receiptNumber: `REC-${paymentId.toUpperCase()}`,
            studentName: selectedStudent?.studentName || "Student",
            admissionNumber: selectedStudent?.admissionNumber || "ADM001",
            className: selectedStudent?.className || "Class 1",
            paidAt: payment.date,
            totalCharges: payment.amount,
            deposit: payment.amount,
            remainingBalance: 0,
            currencySymbol: "AED",
            particulars: [{ name: payment.feeType, amount: payment.amount }],
          };
        } else {
          toast({ title: "Error", description: "Receipt data not available.", variant: "destructive" });
          return;
        }
      }

      const html = buildReceiptHtml(receipt, school);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, "_blank");
      
      if (!newWindow) {
        toast({ title: "Popup blocked", description: "Allow popups to view the receipt.", variant: "destructive" });
      }
      
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load receipt", variant: "destructive" });
    } finally {
      setPrintingId(null);
    }
  };

  const confirmDeleteCharge = (id: string, name: string) => {
    setDeleteItem({ type: 'charge', id, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteItem) return;
    // Handle deletion logic here
    setDeleteModalOpen(false);
    setDeleteItem(null);
    toast({
      title: "Deleted",
      description: "Item deleted successfully",
    });
  };

  const openQuickPay = async (record: StudentBillingRecord) => {
    const ledgerBalance = await loadStudentDetailData(record.studentId);

    setQuickPayData({
      studentId: record.studentId,
      studentName: record.studentName,
      admissionNumber: record.admissionNumber,
      balance: ledgerBalance ?? record.balance,
    });
    setQuickPayOpen(true);
  };

  const getActionButton = (record: StudentBillingRecord) => {
    switch (record.status) {
      case "Paid":
        return (
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 cursor-default">
            <Check className="h-3 w-3" />
            Paid
          </button>
        );
      case "Unpaid":
        return (
          <button 
            onClick={() => openQuickPay(record)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          >
            Pay now
          </button>
        );
      case "Partial":
        return (
          <button 
            onClick={() => openQuickPay(record)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          >
            Pay rest
          </button>
        );
      default:
        return <span className="text-slate-400">—</span>;
    }
  };

  if (view === "detail" && selectedStudent) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setView("list")}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to students
        </button>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-[hsl(204,100%,94%)] border border-[hsl(204,100%,90%)] flex items-center justify-center">
                  <span className="text-lg font-semibold text-[hsl(189,95%,43%)]">
                    {getInitials(selectedStudent.studentName)}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-slate-900">{selectedStudent.studentName}</h2>
                  <p className="text-sm text-slate-500">
                    Adm# {selectedStudent.admissionNumber} · {selectedStudent.className} – {selectedStudent.batch}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setManualChargeOpen(true)}>
                  + Manual charge
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]"
                  onClick={() => openQuickPay(selectedStudent)}
                >
                  <CreditCard className="h-4 w-4 mr-1.5" />
                  Record payment
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-1.5" />
                      Download statement
                      <ChevronDown className="h-4 w-4 ml-1.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => generateSingleStudentReport()}>Student statement (PDF)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewReceipt("latest")}>Latest receipt</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Total charged</p>
              <p className="text-2xl font-semibold text-slate-900">{formatCurrency(selectedStudent.charged)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Total paid</p>
              <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(selectedStudent.paid)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Balance due</p>
              <p className="text-2xl font-semibold text-rose-600">{formatCurrency(selectedStudent.balance)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-medium text-slate-900">Charges</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Fee type</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Month</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Amount</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Paid</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Balance</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-slate-400">
                    No charges yet — click Generate outstanding to create charges.
                  </TableCell>
                </TableRow>
              ) : (
                charges.map((charge) => (
                  <TableRow key={charge.id} className="border-b border-slate-100">
                    <TableCell className="font-medium text-slate-700">{charge.feeType}</TableCell>
                    <TableCell className="text-slate-600">{charge.month || "—"}</TableCell>
                    <TableCell className="text-slate-600">{formatCurrency(charge.amount)}</TableCell>
                    <TableCell className="text-slate-600">{formatCurrency(charge.paid)}</TableCell>
                    <TableCell className="text-slate-600">{formatCurrency(charge.balance)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(charge.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(charge.status)}`} />
                        {charge.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-medium text-slate-900">Payment history</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Fee type</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Amount</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Mode</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Reference</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-slate-400">
                    No payments recorded.
                  </TableCell>
                </TableRow>
              ) : (
                paymentHistory.map((payment) => (
                  <TableRow key={payment.id} className="border-b border-slate-100">
                    <TableCell className="text-slate-600">{payment.date}</TableCell>
                    <TableCell className="font-medium text-slate-700">{payment.feeType}</TableCell>
                    <TableCell className="text-slate-600">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-slate-600">{payment.mode}</TableCell>
                    <TableCell className="text-slate-600">{payment.reference || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                        disabled={!!printingId}
                        onClick={() => handleViewReceipt(payment.id)}
                      >
                        <Printer className="h-3.5 w-3.5 mr-1" />
                        {printingId === payment.id ? "Opening..." : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <ManualChargeModal
          isOpen={manualChargeOpen}
          onClose={() => setManualChargeOpen(false)}
          onSave={handleManualCharge}
        />
        <QuickPayModal
          isOpen={quickPayOpen}
          onClose={() => setQuickPayOpen(false)}
          onSave={handleQuickPay}
          studentData={quickPayData}
          charges={charges}
        />
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeleteItem(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Charge"
          description="Are you sure you want to delete this charge? This action cannot be undone."
          itemName={deleteItem?.name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search name or admission #"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>
        
        <Select value={classFilter || "all"} onValueChange={(v) => setClassFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">All classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">All status</SelectItem>
            <SelectItem value="Paid" className="text-sm">Paid</SelectItem>
            <SelectItem value="Unpaid" className="text-sm">Unpaid</SelectItem>
            <SelectItem value="Partial" className="text-sm">Partial</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => setGenerateModalOpen(true)}>
          Generate outstanding
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Download
              <ChevronDown className="h-4 w-4 ml-1.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => generateStudentReport("Current filtered list")}>Current filtered list</DropdownMenuItem>
            <DropdownMenuItem onClick={() => generateStudentReport("All students list")}>All students list</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          size="sm" 
          className="bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]"
          onClick={() => setRecordPaymentOpen(true)}
        >
          <CreditCard className="h-4 w-4 mr-1.5" />
          Record payment
        </Button>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-[hsl(189,95%,43%)]/10 border border-[hsl(189,95%,43%)]/20 rounded-lg">
          <span className="text-sm text-[hsl(194,70%,27%)]">
            {activeFilters.join(" · ")} — {filteredRecords.length} students
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs text-[hsl(194,70%,27%)] hover:text-[hsl(194,70%,20%)] hover:bg-[hsl(189,95%,43%)]/20"
            onClick={() => generateStudentReport("Current filtered list")}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Download this list
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Student</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Class / Batch</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Charged</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Paid</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Balance</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-slate-400">
                  No students found. Add students and generate outstanding to begin.
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow 
                  key={record.id} 
                  className="border-b border-slate-100 cursor-pointer hover:bg-slate-50"
                  onClick={() => {
                    setSelectedStudent(record);
                    setView("detail");
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <span className="text-xs font-semibold text-slate-600">
                          {getInitials(record.studentName)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{record.studentName}</p>
                        <p className="text-xs text-slate-500">{record.admissionNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{record.className} – {record.batch}</TableCell>
                  <TableCell className="text-slate-600">{formatCurrency(record.charged)}</TableCell>
                  <TableCell className="text-slate-600">{formatCurrency(record.paid)}</TableCell>
                  <TableCell className="font-medium text-slate-700">{formatCurrency(record.balance)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(record.status)}`} />
                      {record.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {getActionButton(record)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <GenerateOutstandingModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onGenerate={handleGenerateOutstanding}
        classes={classes}
      />
      <RecordPaymentModal
        isOpen={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        onSave={handleRecordPayment}
        students={students}
      />
      <QuickPayModal
        isOpen={quickPayOpen}
        onClose={() => setQuickPayOpen(false)}
        onSave={handleQuickPay}
        studentData={quickPayData}
        charges={charges}
      />
    </div>
  );
}
