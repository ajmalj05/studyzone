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
import { DollarSign, List, CreditCard, AlertCircle } from "lucide-react";

interface FeeStructureDto {
  id: string;
  classId: string;
  className: string;
  academicYearId?: string;
  academicYearName?: string;
  name: string;
  amount: number;
  frequency: string;
}

const FEE_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface FeeLedgerDto {
  studentId: string;
  studentName: string;
  className?: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  feePaymentStartMonth?: number;
  charges: { id: string; period: string; amount: number }[];
  payments: { id: string; amount: number; receiptNumber: string; paidAt: string; mode: string }[];
}

interface PaymentDto {
  id: string;
  amount: number;
  receiptNumber: string;
  paidAt: string;
  mode: string;
}

interface ClassDto {
  id: string;
  name: string;
}

interface StudentDto {
  id: string;
  name: string;
  admissionNumber: string;
  className?: string;
}

export default function Fees() {
  const { selectedYearId, academicYears, setSelectedYearId } = useAcademicYear();
  const [structures, setStructures] = useState<FeeStructureDto[]>([]);
  const [outstanding, setOutstanding] = useState<FeeLedgerDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [ledger, setLedger] = useState<FeeLedgerDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [paymentForm, setPaymentForm] = useState({ studentId: "", amount: "", mode: "Cash" });
  const [structureForm, setStructureForm] = useState({ classId: "", academicYearId: "", name: "", amount: "", frequency: "Monthly" });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [structureModalOpen, setStructureModalOpen] = useState(false);

  const loadStructures = async () => {
    try {
      const url = selectedYearId
        ? `/Fees/structures?academicYearId=${encodeURIComponent(selectedYearId)}`
        : "/Fees/structures";
      const list = (await fetchApi(url)) as FeeStructureDto[];
      setStructures(list);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load fee structures", variant: "destructive" });
    }
  };

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
      await Promise.all([loadStructures(), loadOutstanding(), loadClasses(), loadStudents()]);
      setLoading(false);
    })();
  }, [classFilter, selectedYearId]);

  useEffect(() => {
    if (selectedStudentId) loadLedger(selectedStudentId);
    else setLedger(null);
  }, [selectedStudentId]);

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
      if (paymentForm.studentId === selectedStudentId) loadLedger(selectedStudentId);
      await loadOutstanding();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureForm.classId || !structureForm.name.trim() || !structureForm.amount || Number(structureForm.amount) <= 0) {
      toast({ title: "Validation", description: "Class, name and amount required.", variant: "destructive" });
      return;
    }
    const academicYearId = structureForm.academicYearId || selectedYearId;
    if (!academicYearId) {
      toast({ title: "Validation", description: "Select an academic year.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/Fees/structures", {
        method: "POST",
        body: JSON.stringify({
          classId: structureForm.classId,
          academicYearId,
          name: structureForm.name,
          amount: Number(structureForm.amount),
          frequency: structureForm.frequency,
        }),
      });
      toast({ title: "Success", description: "Fee structure created." });
      setStructureForm({ classId: "", academicYearId: "", name: "", amount: "", frequency: "Monthly" });
      setStructureModalOpen(false);
      await loadStructures();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const totalOutstanding = outstanding.reduce((s, x) => s + x.balance, 0);
  const totalCollected = outstanding.reduce((s, x) => s + x.totalPayments, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardHeader title="Fee Management" />
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
              <TabsTrigger value="ledger" className="flex items-center gap-2"><List className="h-4 w-4" /> Student ledger</TabsTrigger>
              <TabsTrigger value="structures" className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Fee structures</TabsTrigger>
            </TabsList>

            <TabsContent value="outstanding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Outstanding by class</CardTitle>
                  <CardDescription>Students with balance &gt; 0 (scoped by academic year)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Select value={selectedYearId || (academicYears[0]?.id ?? "")} onValueChange={(v) => v && setSelectedYearId(v)}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Academic year" /></SelectTrigger>
                      <SelectContent>{academicYears.map((y) => (<SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>))}</SelectContent>
                    </Select>
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
                          <TableCell>{o.feePaymentStartMonth != null && o.feePaymentStartMonth >= 1 && o.feePaymentStartMonth <= 12 ? FEE_MONTH_NAMES[o.feePaymentStartMonth - 1] : "—"}</TableCell>
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

            <TabsContent value="ledger" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student fee ledger</CardTitle>
                  <CardDescription>View charges, payments and balance for a student.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label>Student</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger className="w-[280px] mt-1"><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent>{students.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  {ledger && (
                    <div className="space-y-4">
                      <p><strong>Total charges:</strong> {formatCurrency(ledger.totalCharges)} | <strong>Total payments:</strong> {formatCurrency(ledger.totalPayments)} | <strong>Balance:</strong> {formatCurrency(ledger.balance)}{ledger.feePaymentStartMonth != null && ledger.feePaymentStartMonth >= 1 && ledger.feePaymentStartMonth <= 12 ? <> | <strong>Fees start from:</strong> {FEE_MONTH_NAMES[ledger.feePaymentStartMonth - 1]}</> : ""}</p>
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
            </TabsContent>

            <TabsContent value="structures" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fee structures</CardTitle>
                  <CardDescription>Define fee by class and academic year (e.g. Tuition, Lab).</CardDescription>
                  <div className="flex gap-2 pt-2">
                    <Select value={selectedYearId || (academicYears[0]?.id ?? "")} onValueChange={(v) => v && setSelectedYearId(v)}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Academic year" /></SelectTrigger>
                      <SelectContent>{academicYears.map((y) => (<SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => { setStructureForm((f) => ({ ...f, academicYearId: selectedYearId })); setStructureModalOpen(true); }}>Add fee structure</Button>
                  <Dialog open={structureModalOpen} onOpenChange={(open) => { if (open) setStructureForm((f) => ({ ...f, academicYearId: selectedYearId })); setStructureModalOpen(open); }}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add fee structure</DialogTitle>
                        <DialogDescription>Define fee by class and academic year.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateStructure} className="space-y-3">
                        <div className="space-y-1"><Label>Academic year *</Label><Select value={structureForm.academicYearId || selectedYearId} onValueChange={(v) => setStructureForm((f) => ({ ...f, academicYearId: v }))}><SelectTrigger><SelectValue placeholder="Academic year" /></SelectTrigger><SelectContent>{academicYears.map((y) => (<SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>))}</SelectContent></Select></div>
                        <div className="space-y-1"><Label>Class</Label><Select value={structureForm.classId} onValueChange={(v) => setStructureForm((f) => ({ ...f, classId: v }))}><SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger><SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select></div>
                        <div className="space-y-1"><Label>Name</Label><Input value={structureForm.name} onChange={(e) => setStructureForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Tuition" /></div>
                        <div className="space-y-1"><Label>Amount (₹)</Label><Input type="number" min="0" step="0.01" value={structureForm.amount} onChange={(e) => setStructureForm((f) => ({ ...f, amount: e.target.value }))} /></div>
                        <div className="space-y-1"><Label>Frequency</Label><Select value={structureForm.frequency} onValueChange={(v) => setStructureForm((f) => ({ ...f, frequency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Monthly">Monthly</SelectItem><SelectItem value="Quarterly">Quarterly</SelectItem><SelectItem value="HalfYearly">Half-yearly</SelectItem><SelectItem value="Yearly">Yearly</SelectItem></SelectContent></Select></div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setStructureModalOpen(false)}>Cancel</Button>
                          <Button type="submit">Add</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Table>
                    <TableHeader><TableRow><TableHead>Class</TableHead><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Frequency</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {structures.map((s) => (
                        <TableRow key={s.id}><TableCell>{s.className}</TableCell><TableCell>{s.name}</TableCell><TableCell>{formatCurrency(s.amount)}</TableCell><TableCell>{s.frequency}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </div>
  );
}
