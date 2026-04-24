import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApi } from "@/lib/api";
import { buildReceiptHtml, type SchoolProfileForReceipt } from "@/lib/receiptHtml";
import type { FeeReceiptDto } from "@/types/fees";
import { Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";

interface ParentChildDto {
  studentId: string;
  name: string;
  className?: string;
}

interface LedgerDto {
  studentName?: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  charges: { id?: string; period: string; amount: number; paid: number; balance: number; particularName?: string; description?: string }[];
  payments: { id: string; amount: number; receiptNumber: string; paidAt: string; mode?: string; feeType?: string }[];
}

const ParentFees = () => {
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("studentId");
  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [studentId, setStudentId] = useState(studentIdParam ?? "");
  const [ledger, setLedger] = useState<LedgerDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const handlePrintReceipt = async (paymentId: string) => {
    if (!paymentId || printingId) return;
    // Open synchronously on click so the browser treats it as user-initiated (not a blocked popup).
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Allow popups for this site, or use your browser settings to allow popups for this page.",
        variant: "destructive",
      });
      return;
    }
    printWindow.document.write(
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Receipt</title></head><body style='font-family:system-ui;padding:1rem'>Loading receipt…</body></html>"
    );
    printWindow.document.close();

    setPrintingId(paymentId);
    try {
      const [receipt, school] = await Promise.all([
        fetchApi(`/ParentPortal/receipt/${encodeURIComponent(paymentId)}`) as Promise<FeeReceiptDto>,
        fetchApi("/SchoolProfile").catch(() => null) as Promise<SchoolProfileForReceipt | null>,
      ]);
      if (!receipt) {
        printWindow.close();
        toast({ title: "Error", description: "Receipt not found.", variant: "destructive" });
        return;
      }
      const html = buildReceiptHtml(receipt, school);
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      try {
        printWindow.opener = null;
      } catch {
        /* ignore */
      }
    } catch (e: unknown) {
      printWindow.close();
      toast({ title: "Error", description: (e as Error).message || "Failed to load receipt", variant: "destructive" });
    } finally {
      setPrintingId(null);
    }
  };

  useEffect(() => {
    fetchApi("/ParentPortal/my-children")
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setChildren(arr);
        if (!studentId && arr.length > 0) setStudentId(arr[0].studentId);
        if (studentIdParam && arr.some((c: ParentChildDto) => c.studentId === studentIdParam)) setStudentId(studentIdParam);
      })
      .catch(() => setChildren([]));
  }, [studentIdParam]);

  useEffect(() => {
    if (!studentId) {
      setLedger(null);
      return;
    }
    setLoading(true);
    fetchApi(`/ParentPortal/children/${studentId}/fees`)
      .then((d) => setLedger(d as LedgerDto))
      .catch(() => setLedger(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div className="space-y-4">
      <Card className="rounded-[var(--radius)]">
        <CardContent className="pt-6">
          <SearchableSelect
            value={studentId}
            onValueChange={setStudentId}
            placeholder="Select child"
            className="w-[280px] rounded-xl"
            options={children.map((c) => ({
              value: c.studentId,
              label: `${c.name}${c.className ? ` (${c.className})` : ""}`,
            }))}
          />
        </CardContent>
      </Card>
      {studentId && (
        <>
          {loading ? (
            <Card><CardContent className="p-8">Loading...</CardContent></Card>
          ) : ledger ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Charges</CardTitle></CardHeader>
                  <CardContent><span className="text-lg font-semibold">AED {ledger.totalCharges.toLocaleString()}</span></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle></CardHeader>
                  <CardContent><span className="text-lg font-semibold">AED {ledger.totalPayments.toLocaleString()}</span></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Balance Due</CardTitle></CardHeader>
                  <CardContent><span className="text-lg font-semibold">AED {ledger.balance.toLocaleString()}</span></CardContent>
                </Card>
              </div>

              {/* Charges - Beautiful Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Charges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/50 border-b border-border/60">
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Fee Type</th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Period</th>
                            <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(ledger.charges ?? []).length === 0 ? (
                            <tr>
                              <td colSpan={3} className="text-center py-8 text-sm text-muted-foreground">
                                No charges found
                              </td>
                            </tr>
                          ) : (
                            (ledger.charges ?? []).map((c, i) => (
                              <tr key={c.id ?? i} className="border-b border-border/30 last:border-0 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-900/20 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                                    {c.particularName || "Fee"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.period}</td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">AED {c.amount.toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payments - Beautiful Table */}
              <Card>
                <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/50 border-b border-border/60">
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Date</th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Fee Type</th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Receipt</th>
                            <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Amount</th>
                            <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 w-[80px]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(ledger.payments ?? []).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                                No payments found
                              </td>
                            </tr>
                          ) : (
                            (ledger.payments ?? []).map((p, i) => (
                              <tr key={p.id ?? i} className="border-b border-border/30 last:border-0 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800">
                                    {(p.feeType && String(p.feeType).trim()) ? String(p.feeType).trim() : "General"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{p.receiptNumber}</td>
                                <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">AED {p.amount.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right">
                                  {p.id && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={!!printingId}
                                      onClick={() => handlePrintReceipt(p.id)}
                                      className="h-7 px-2 text-xs gap-1"
                                    >
                                      <Printer className="h-3 w-3" />
                                      Print
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card><CardContent className="p-8 text-muted-foreground">No fee data for this child.</CardContent></Card>
          )}
        </>
      )}
    </div>
  );
};

export default ParentFees;
