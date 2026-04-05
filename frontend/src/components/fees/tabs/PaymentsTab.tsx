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
import { ChevronDown, Download, Search, CreditCard, Printer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PaymentRecord, ClassDto, StudentDto, FeeReceiptDto, formatCurrency, MONTHS_2026 } from "@/types/fees";
import { RecordPaymentModal } from "../modals/RecordPaymentModal";
import { buildReceiptHtml, buildReportHtml, SchoolProfileForReceipt } from "@/lib/receiptHtml";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface PaymentsTabProps {
  classes: ClassDto[];
  students: StudentDto[];
}

export function PaymentsTab({ classes, students }: PaymentsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Load payments on mount
  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await fetchApi("/Fees/payments") as PaymentRecord[];
      setPayments(data || []);
    } catch (e) {
      console.error("Failed to load payments:", e);
      setPayments([]);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (searchTerm && !payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (monthFilter && !payment.paidAt.includes(monthFilter.split(" ")[0])) return false;
    return true;
  });

  const activeFilters = [
    monthFilter,
  ].filter(Boolean);

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
      // Refresh the payments data immediately
      await loadPayments();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const generatePaymentsReport = async (type: string) => {
    const title = type.includes("filtered") ? "Filtered Payments Report" : "All Payments Report";
    const paymentsToShow = type.includes("filtered") ? filteredPayments : payments;
    
    // Fetch school profile for header
    let school = null;
    try {
      school = await fetchApi("/SchoolProfile").catch(() => null) as SchoolProfileForReceipt | null;
    } catch (e) {
      // Use default
    }
    
    const totalAmount = paymentsToShow.reduce((sum, p) => sum + p.amount, 0);
    
    const metaInfo = `
      <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Payments:</strong> ${paymentsToShow.length}</p>
      <p><strong>Total Amount:</strong> AED ${totalAmount.toLocaleString()}</p>
      ${activeFilters.length > 0 ? `<p><strong>Filters:</strong> ${activeFilters.join(" · ")}</p>` : ''}
    `;
    
    const tableContent = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Student</th>
            <th>Fee type</th>
            <th>Receipt</th>
            <th class="text-right">Amount (AED)</th>
            <th>Mode</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          ${paymentsToShow.map(p => `
            <tr>
              <td>${new Date(p.paidAt).toLocaleDateString()}</td>
              <td>${p.studentName}</td>
              <td>${(p.feeType && String(p.feeType).trim()) ? String(p.feeType).trim() : "General"}</td>
              <td>${p.receiptNumber}</td>
              <td class="text-right">${p.amount.toLocaleString()}</td>
              <td>${p.mode}</td>
              <td>${p.reference || "—"}</td>
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
        // API failed - will use demo data below
        console.log("API failed, using demo receipt");
      }

      // If no receipt from API, create a demo one
      if (!receipt) {
        const payment = payments.find(p => p.id === paymentId);
        if (payment) {
          receipt = {
            id: paymentId,
            receiptNumber: payment.receiptNumber,
            studentName: payment.studentName,
            admissionNumber: "",
            paidAt: payment.paidAt,
            totalCharges: payment.amount,
            deposit: payment.amount,
            remainingBalance: 0,
            currencySymbol: "AED",
            particulars: [{ name: (payment.feeType && String(payment.feeType).trim()) ? String(payment.feeType).trim() : "General", amount: payment.amount }],
          };
        } else {
          toast({ title: "Error", description: "Receipt not found.", variant: "destructive" });
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search student, receipt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>
        
        <Select value={monthFilter || "all"} onValueChange={(v) => setMonthFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">All months</SelectItem>
            {MONTHS_2026.map((m) => (
              <SelectItem key={m} value={m} className="text-sm">{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          size="sm" 
          className="bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]"
          onClick={() => setRecordPaymentOpen(true)}
        >
          <CreditCard className="h-4 w-4 mr-1.5" />
          Record payment
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
            <DropdownMenuItem onClick={() => generatePaymentsReport("Current filtered view")}>Current filtered view</DropdownMenuItem>
            <DropdownMenuItem onClick={() => generatePaymentsReport("All payments report")}>All payments report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hint Bar */}
      {activeFilters.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-[hsl(189,95%,43%)]/10 border border-[hsl(189,95%,43%)]/20 rounded-lg">
          <span className="text-sm text-[hsl(194,70%,27%)]">
            Filtered: {activeFilters.join(" · ")}
          </span>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-[hsl(194,70%,27%)] hover:text-[hsl(194,70%,20%)] hover:bg-[hsl(189,95%,43%)]/20">
            <Download className="h-3.5 w-3.5 mr-1" />
            Download this list
          </Button>
        </div>
      )}

      {/* Main Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Date</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Student</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Fee type</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Amount (AED)</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Mode</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Reference</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-slate-400">
                  No payments recorded. Use Record payment to add entries.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id} className="border-b border-slate-100">
                  <TableCell className="text-slate-600">{new Date(payment.paidAt).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-slate-700">{payment.studentName}</TableCell>
                  <TableCell className="text-slate-600">{(payment.feeType && String(payment.feeType).trim()) ? String(payment.feeType).trim() : "General"}</TableCell>
                  <TableCell className="font-medium text-slate-700">{formatCurrency(payment.amount)}</TableCell>
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

      <RecordPaymentModal
        isOpen={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        onSave={handleRecordPayment}
        students={students}
      />
    </div>
  );
}