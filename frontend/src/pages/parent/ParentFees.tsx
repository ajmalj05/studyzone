import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApi } from "@/lib/api";
import { buildReceiptHtml, type SchoolProfileForReceipt } from "@/lib/receiptHtml";
import type { FeeReceiptDto } from "@/types/fees";
import { Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
      <h1 className="text-lg font-semibold text-foreground">Fees</h1>
      <Card className="rounded-[var(--radius)]">
        <CardContent className="pt-6">
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="w-[280px] rounded-xl">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((c) => (
                <SelectItem key={c.studentId} value={c.studentId}>{c.name} {c.className ? `(${c.className})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <Card>
                <CardHeader>
                  <CardTitle>Charges</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(ledger.charges ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No charges found
                          </TableCell>
                        </TableRow>
                      ) : (
                        (ledger.charges ?? []).map((c, i) => (
                          <TableRow key={c.id ?? i}>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                {c.particularName || "Fee"}
                              </span>
                            </TableCell>
                            <TableCell>{c.period}</TableCell>
                            <TableCell className="text-right">AED {c.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fee type</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(ledger.payments ?? []).map((p, i) => (
                        <TableRow key={p.id ?? i}>
                          <TableCell>{new Date(p.paidAt).toLocaleDateString()}</TableCell>
                          <TableCell>{(p.feeType && String(p.feeType).trim()) ? String(p.feeType).trim() : "General"}</TableCell>
                          <TableCell>{p.receiptNumber}</TableCell>
                          <TableCell>{p.mode ?? "—"}</TableCell>
                          <TableCell className="text-right">AED {p.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            {p.id && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!!printingId}
                                onClick={() => handlePrintReceipt(p.id)}
                                className="gap-1"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                Print
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
