import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApi } from "@/lib/api";

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
  charges: { period: string; amount: number }[];
  payments: { amount: number; receiptNumber: string; paidAt: string; mode?: string }[];
}

const ParentFees = () => {
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("studentId");
  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [studentId, setStudentId] = useState(studentIdParam ?? "");
  const [ledger, setLedger] = useState<LedgerDto | null>(null);
  const [loading, setLoading] = useState(false);

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
                  <CardContent><span className="text-lg font-semibold">₹{ledger.totalCharges.toLocaleString()}</span></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle></CardHeader>
                  <CardContent><span className="text-lg font-semibold">₹{ledger.totalPayments.toLocaleString()}</span></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Balance Due</CardTitle></CardHeader>
                  <CardContent><span className="text-lg font-semibold">₹{ledger.balance.toLocaleString()}</span></CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Charges</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Period</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {(ledger.charges ?? []).map((c, i) => (
                        <TableRow key={i}><TableCell>{c.period}</TableCell><TableCell className="text-right">₹{c.amount.toLocaleString()}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Date</TableHead><TableHead>Receipt</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {(ledger.payments ?? []).map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(p.paidAt).toLocaleDateString()}</TableCell>
                          <TableCell>{p.receiptNumber}</TableCell>
                          <TableCell>{p.mode ?? "—"}</TableCell>
                          <TableCell className="text-right">₹{p.amount.toLocaleString()}</TableCell>
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
