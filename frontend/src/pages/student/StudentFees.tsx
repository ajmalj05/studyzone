import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchApi } from "@/lib/api";
import { getStudentMenu } from "@/config/studentMenu";

export default function StudentFees() {
  const [ledger, setLedger] = useState<{
    studentName: string;
    totalCharges: number;
    totalPayments: number;
    balance: number;
    charges: { period: string; amount: number }[];
    payments: { amount: number; receiptNumber: string; paidAt: string; mode: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = (await fetchApi("/Portal/fees")) as typeof ledger;
        setLedger(data ?? null);
      } catch (_) {
        setLedger(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Fees Status</h1>
        {loading ? (
          <Card><CardContent className="p-8">Loading...</CardContent></Card>
        ) : ledger ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Charges</CardTitle></CardHeader>
                <CardContent><span className="text-2xl font-bold">₹{ledger.totalCharges.toLocaleString()}</span></CardContent>
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
                        <TableCell>{p.mode}</TableCell>
                        <TableCell className="text-right">₹{p.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card><CardContent className="p-8 text-muted-foreground">No fee data found.</CardContent></Card>
        )}
    </div>
  );
}
