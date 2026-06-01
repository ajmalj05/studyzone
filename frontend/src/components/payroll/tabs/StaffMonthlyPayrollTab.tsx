import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, CheckCircle, MinusCircle, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import {
  StaffSalaryPaymentDto,
  PAYROLL_MONTHS,
  currentPayrollDate,
  formatPayrollCurrency,
  payrollMonthName,
} from "@/types/payroll";
import { StaffPaymentDetailsDialog } from "@/components/payroll/modals/StaffPaymentDetailsDialog";

export function StaffMonthlyPayrollTab() {
  const [payrollYear, setPayrollYear] = useState(currentPayrollDate.getFullYear());
  const [payrollMonth, setPayrollMonth] = useState(currentPayrollDate.getMonth() + 1);
  const [payments, setPayments] = useState<StaffSalaryPaymentDto[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [markPaidPayment, setMarkPaidPayment] = useState<StaffSalaryPaymentDto | null>(null);
  const [lineModalPayment, setLineModalPayment] = useState<StaffSalaryPaymentDto | null>(null);
  const [lineForm, setLineForm] = useState({ lineType: "Deduction" as "Deduction" | "Addition", description: "", amount: "" });
  const [detailPayment, setDetailPayment] = useState<StaffSalaryPaymentDto | null>(null);

  const loadPaymentsForMonth = async () => {
    const y = payrollYear >= 1 && payrollYear <= 9999 ? payrollYear : new Date().getFullYear();
    const m = payrollMonth >= 1 && payrollMonth <= 12 ? payrollMonth : new Date().getMonth() + 1;
    setPaymentsLoading(true);
    try {
      const list = (await fetchApi(`/StaffSalary/payments?year=${y}&month=${m}`)) as StaffSalaryPaymentDto[];
      setPayments(Array.isArray(list) ? list : []);
    } catch {
      setPayments([]);
    }
    setPaymentsLoading(false);
  };

  useEffect(() => {
    if (payrollYear >= 1 && payrollMonth >= 1 && payrollMonth <= 12) loadPaymentsForMonth();
  }, [payrollYear, payrollMonth]);

  const handleGeneratePayroll = async () => {
    setGenerateLoading(true);
    try {
      await fetchApi("/StaffSalary/payments", {
        method: "POST",
        body: JSON.stringify({ year: payrollYear, month: payrollMonth }),
      });
      toast({ title: "Payroll generated", description: "Payments created for staff members with current pay." });
      loadPaymentsForMonth();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to generate payroll", variant: "destructive" });
    }
    setGenerateLoading(false);
  };

  const handleMarkPaid = async () => {
    if (!markPaidPayment) return;
    try {
      await fetchApi(`/StaffSalary/payments/${markPaidPayment.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Paid", paidAt: new Date().toISOString() }),
      });
      toast({ title: "Marked as paid", description: `${markPaidPayment.staffName}'s payment has been marked paid.` });
      setMarkPaidPayment(null);
      loadPaymentsForMonth();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed", variant: "destructive" });
    }
  };

  const openAddLine = (p: StaffSalaryPaymentDto, lineType: "Deduction" | "Addition") => {
    setLineModalPayment(p);
    setLineForm({ lineType, description: "", amount: "" });
  };

  const handleAddLine = async () => {
    if (!lineModalPayment) return;
    const amount = parseFloat(lineForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Validation", description: "Enter a valid positive amount.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi(`/StaffSalary/payments/${lineModalPayment.id}/lines`, {
        method: "POST",
        body: JSON.stringify({
          lineType: lineForm.lineType,
          description: lineForm.description || lineForm.lineType,
          amount,
        }),
      });
      toast({ title: "Added", description: `${lineForm.lineType} added.` });
      setLineModalPayment(null);
      loadPaymentsForMonth();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleDeleteLine = async (paymentId: string, lineId: string) => {
    try {
      await fetchApi(`/StaffSalary/payments/${paymentId}/lines/${lineId}`, { method: "DELETE" });
      toast({ title: "Removed", description: "Line removed." });
      loadPaymentsForMonth();
      if (detailPayment?.id === paymentId) setDetailPayment(null);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed", variant: "destructive" });
    }
  };

  return (
    <>
      <Card className="rounded-[var(--radius)]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Staff monthly payroll
            </CardTitle>
            <CardDescription>Generate payroll, apply monthly additions/deductions, and mark salaries paid.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchableSelect
              value={String(payrollYear)}
              onValueChange={(v) => setPayrollYear(parseInt(v, 10))}
              className="w-28"
              options={[currentPayrollDate.getFullYear(), currentPayrollDate.getFullYear() - 1, currentPayrollDate.getFullYear() + 1]
                .map((y) => ({ value: String(y), label: String(y) }))}
            />
            <SearchableSelect
              value={String(payrollMonth)}
              onValueChange={(v) => setPayrollMonth(parseInt(v, 10))}
              className="w-32"
              options={PAYROLL_MONTHS.map((m) => ({ value: String(m), label: payrollMonthName(m) }))}
            />
            <Button onClick={handleGeneratePayroll} disabled={generateLoading} className="gap-2">
              {generateLoading ? "Generating..." : "Generate payroll"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading payments...</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No payments for this month yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Staff Member</th>
                    <th className="text-right p-2 font-medium">Base</th>
                    <th className="text-right p-2 font-medium">Additions</th>
                    <th className="text-right p-2 font-medium">Deductions</th>
                    <th className="text-right p-2 font-medium">Net</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Paid date</th>
                    <th className="w-52 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 last:border-0">
                      <td className="p-2 font-medium">{p.staffName ?? p.staffUserId}</td>
                      <td className="p-2 text-right">{formatPayrollCurrency(p.baseAmount)}</td>
                      <td className="p-2 text-right text-green-600">{formatPayrollCurrency(p.totalAdditions)}</td>
                      <td className="p-2 text-right text-red-600">{formatPayrollCurrency(p.totalDeductions)}</td>
                      <td className="p-2 text-right font-medium">{formatPayrollCurrency(p.netAmount)}</td>
                      <td className="p-2">{p.status}</td>
                      <td className="p-2">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {p.status !== "Paid" && (
                            <Button size="sm" variant="outline" onClick={() => setMarkPaidPayment(p)} className="gap-1">
                              <CheckCircle className="h-3 w-3" /> Mark paid
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => openAddLine(p, "Deduction")} className="gap-1 text-red-600">
                            <MinusCircle className="h-3 w-3" /> Deduction
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openAddLine(p, "Addition")} className="gap-1 text-green-600">
                            <TrendingUp className="h-3 w-3" /> Addition
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDetailPayment(p)}>Details</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!markPaidPayment} onOpenChange={(open) => !open && setMarkPaidPayment(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as paid</DialogTitle>
            <DialogDescription>
              {markPaidPayment &&
                `${markPaidPayment.staffName} - ${payrollMonthName(markPaidPayment.month)} ${markPaidPayment.year}. Net: ${formatPayrollCurrency(markPaidPayment.netAmount)}`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidPayment(null)}>Cancel</Button>
            <Button onClick={handleMarkPaid}>Mark paid</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!lineModalPayment} onOpenChange={(open) => !open && setLineModalPayment(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add {lineForm.lineType}</DialogTitle>
            <DialogDescription>
              {lineModalPayment?.staffName} - {lineModalPayment && payrollMonthName(lineModalPayment.month)} {lineModalPayment?.year}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <SearchableSelect
                value={lineForm.lineType}
                onValueChange={(v) => setLineForm((f) => ({ ...f, lineType: v as "Deduction" | "Addition" }))}
                options={[
                  { value: "Deduction", label: "Deduction" },
                  { value: "Addition", label: "Addition" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={lineForm.description} onChange={(e) => setLineForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Tax, Bonus" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (AED)</label>
              <Input type="number" min="0" step="0.01" value={lineForm.amount} onChange={(e) => setLineForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLineModalPayment(null)}>Cancel</Button>
            <Button onClick={handleAddLine}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StaffPaymentDetailsDialog
        payment={detailPayment}
        open={!!detailPayment}
        onOpenChange={(open) => !open && setDetailPayment(null)}
        onDeleteLine={handleDeleteLine}
      />
    </>
  );
}
