import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useAcademicYear } from "@/context/AcademicYearContext";
import {
  FeeLedgerDto,
  StudentDto,
  FEE_MONTH_NAMES,
  formatCurrency,
} from "@/types/fees";

export default function StudentLedger() {
  const { selectedYearId } = useAcademicYear();
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [ledger, setLedger] = useState<FeeLedgerDto | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [generateChargesLoading, setGenerateChargesLoading] = useState(false);

  const loadStudents = async () => {
    try {
      const res = (await fetchApi("/Students?take=500")) as { items: StudentDto[] };
      setStudents(res.items ?? []);
    } catch (_) {}
  };

  const loadLedger = async (studentId: string) => {
    if (!studentId) return;
    try {
      const data = (await fetchApi(`/Fees/ledger/${studentId}`)) as FeeLedgerDto;
      setLedger(data);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load ledger", variant: "destructive" });
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadStudents();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (selectedStudentId) loadLedger(selectedStudentId);
    else setLedger(null);
  }, [selectedStudentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardHeader title="Student Ledger" />
      <Card>
        <CardHeader>
          <CardTitle>Student fee ledger</CardTitle>
          <CardDescription>View charges, payments and balance for a student.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <div>
              <Label>Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="w-[280px] mt-1"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {selectedStudentId && (
              <Button
                type="button"
                variant="outline"
                disabled={generateChargesLoading}
                onClick={async () => {
                  setGenerateChargesLoading(true);
                  try {
                    const result = (await fetchApi("/Fees/generate-charges", {
                      method: "POST",
                      body: JSON.stringify({
                        studentId: selectedStudentId,
                        academicYearId: selectedYearId || undefined,
                      }),
                    })) as { chargesAdded: number };
                    toast({ title: "Charges generated", description: result.chargesAdded === 0 ? "No new charges added (all periods already have charges)." : `${result.chargesAdded} charge(s) added.` });
                    await loadLedger(selectedStudentId);
                  } catch (e: unknown) {
                    toast({ title: "Error", description: (e as Error).message || "Failed to generate charges", variant: "destructive" });
                  }
                  setGenerateChargesLoading(false);
                }}
              >
                {generateChargesLoading ? "Generating…" : "Generate outstanding"}
              </Button>
            )}
          </div>
          {ledger && (
            <div className="space-y-4">
              <p><strong>Total charges:</strong> {formatCurrency(ledger.totalCharges)} | <strong>Total payments:</strong> {formatCurrency(ledger.totalPayments)} | <strong>Balance:</strong> {formatCurrency(ledger.balance)}{ledger.feePaymentStartMonth != null && ledger.feePaymentStartMonth >= 1 && ledger.feePaymentStartMonth <= 12 ? <> | <strong>Fees start from:</strong> {ledger.feePaymentStartYear != null ? `${FEE_MONTH_NAMES[ledger.feePaymentStartMonth - 1]} ${ledger.feePaymentStartYear}` : FEE_MONTH_NAMES[ledger.feePaymentStartMonth - 1]}</> : ""}</p>
              <Table>
                <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Charge</TableHead></TableRow></TableHeader>
                <TableBody>{ledger.charges.map((c) => (<TableRow key={c.id}><TableCell>{c.period}</TableCell><TableCell>{formatCurrency(c.amount)}</TableCell></TableRow>))}</TableBody>
              </Table>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Receipt</TableHead><TableHead>Mode</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                <TableBody>{ledger.payments.map((p) => (<TableRow key={p.id}><TableCell>{new Date(p.paidAt).toLocaleDateString()}</TableCell><TableCell>{p.receiptNumber}</TableCell><TableCell>{p.mode}</TableCell><TableCell>{formatCurrency(p.amount)}</TableCell></TableRow>))}</TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
