import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useAcademicYear } from "@/context/AcademicYearContext";
import { CurrentAcademicYearBadge } from "@/components/CurrentAcademicYearBadge";
import { CreditCard, AlertCircle } from "lucide-react";
import { FeeLedgerDto, ClassDto, StudentDto, FEE_MONTH_NAMES, formatCurrency } from "@/types/fees";

export default function Fees() {
  const { selectedYearId } = useAcademicYear();
  const [outstanding, setOutstanding] = useState<FeeLedgerDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("");
  const [paymentForm, setPaymentForm] = useState({ studentId: "", amount: "", mode: "Cash" });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const loadOutstanding = async () => {
    try {
      const params = new URLSearchParams();
      if (classFilter) params.set("classId", classFilter);
      if (selectedYearId) params.set("academicYearId", selectedYearId);
      const url = params.toString() ? `/Fees/outstanding?${params}` : "/Fees/outstanding";
      const list = (await fetchApi(url)) as FeeLedgerDto[];
      setOutstanding(list);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load outstanding", variant: "destructive" });
    }
  };

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch (_) {}
  };

  const loadStudents = async () => {
    try {
      const res = (await fetchApi("/Students?take=500")) as { items: StudentDto[] };
      setStudents(res.items ?? []);
    } catch (_) {}
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadOutstanding(), loadClasses(), loadStudents()]);
      setLoading(false);
    })();
  }, [classFilter, selectedYearId]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.studentId || !paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast({ title: "Validation", description: "Select student and enter amount.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/Fees/payments", {
        method: "POST",
        body: JSON.stringify({
          studentId: paymentForm.studentId,
          amount: Number(paymentForm.amount),
          mode: paymentForm.mode,
        }),
      });
      toast({ title: "Success", description: "Payment recorded." });
      setPaymentForm({ studentId: "", amount: "", mode: "Cash" });
      setPaymentModalOpen(false);
      await loadOutstanding();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const totalOutstanding = outstanding.reduce((s, x) => s + x.balance, 0);
  const totalCollected = outstanding.reduce((s, x) => s + x.totalPayments, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DashboardHeader title="Fee Management" />
        <CurrentAcademicYearBadge />
      </div>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total collected (outstanding list)</CardTitle></CardHeader>
              <CardContent><span className="text-lg font-semibold">{formatCurrency(totalCollected)}</span></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle></CardHeader>
              <CardContent><span className="text-lg font-semibold text-warning">{formatCurrency(totalOutstanding)}</span></CardContent>
            </Card>
          </div>
          <Tabs defaultValue="outstanding" className="space-y-4">
            <TabsList>
              <TabsTrigger value="outstanding" className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Outstanding</TabsTrigger>
              <TabsTrigger value="collect" className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Record payment</TabsTrigger>
            </TabsList>

            <TabsContent value="outstanding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Outstanding by class</CardTitle>
                  <CardDescription>Students with balance &gt; 0 (scoped by academic year)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Select value={classFilter || "all"} onValueChange={(v) => setClassFilter(v === "all" ? "" : v)}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by class" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All classes</SelectItem>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Fee start</TableHead><TableHead>Charges</TableHead><TableHead>Payments</TableHead><TableHead>Balance</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {outstanding.map((o) => (
                        <TableRow key={o.studentId}>
                          <TableCell>{o.studentName}</TableCell>
                          <TableCell>{o.className ?? "—"}</TableCell>
                          <TableCell>{o.feePaymentStartMonth != null && o.feePaymentStartMonth >= 1 && o.feePaymentStartMonth <= 12 ? (o.feePaymentStartYear != null ? `${FEE_MONTH_NAMES[o.feePaymentStartMonth - 1]} ${o.feePaymentStartYear}` : FEE_MONTH_NAMES[o.feePaymentStartMonth - 1]) : "—"}</TableCell>
                          <TableCell>{formatCurrency(o.totalCharges)}</TableCell>
                          <TableCell>{formatCurrency(o.totalPayments)}</TableCell>
                          <TableCell className="font-medium text-warning">{formatCurrency(o.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="collect" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Record payment</CardTitle>
                  <CardDescription>Collect fee and generate receipt number.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setPaymentModalOpen(true)}>Record payment</Button>
                  <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Record payment</DialogTitle>
                        <DialogDescription>Select student, amount and mode.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleRecordPayment} className="space-y-3">
                        <div className="space-y-1">
                          <Label>Student</Label>
                          <Select value={paymentForm.studentId} onValueChange={(v) => setPaymentForm((f) => ({ ...f, studentId: v }))} required>
                            <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                            <SelectContent>{students.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1"><Label>Amount (₹)</Label><Input type="number" min="1" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))} placeholder="Amount" required /></div>
                        <div className="space-y-1"><Label>Mode</Label><Select value={paymentForm.mode} onValueChange={(v) => setPaymentForm((f) => ({ ...f, mode: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="UPI">UPI</SelectItem><SelectItem value="BankTransfer">Bank transfer</SelectItem><SelectItem value="Card">Card</SelectItem></SelectContent></Select></div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                          <Button type="submit">Record</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </div>
  );
}
