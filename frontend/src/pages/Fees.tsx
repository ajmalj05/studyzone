import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CreditCard, AlertCircle, Banknote } from "lucide-react";
import { FeeLedgerDto, ClassDto, StudentDto, FEE_MONTH_NAMES, formatCurrency } from "@/types/fees";

export default function Fees() {
  const { selectedYearId } = useAcademicYear();
  const [outstanding, setOutstanding] = useState<FeeLedgerDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"student" | "balance">("balance");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [recalculating, setRecalculating] = useState(false);
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

  const recalculateOutstanding = async () => {
    try {
      setRecalculating(true);
      const params = new URLSearchParams();
      if (classFilter) params.set("classId", classFilter);
      if (selectedYearId) params.set("academicYearId", selectedYearId);
      const url = params.toString() ? `/Fees/outstanding/recalculate?${params}` : "/Fees/outstanding/recalculate";
      await fetchApi(url, { method: "POST" });
      await loadOutstanding();
      toast({
        title: "Outstanding generated",
        description: "Outstanding balances have been recalculated for the selected filters.",
      });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to recalculate outstanding",
        variant: "destructive",
      });
    } finally {
      setRecalculating(false);
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

  const filteredOutstanding = outstanding.filter((o) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return o.studentName.toLowerCase().includes(term);
  });

  const sortedOutstanding = [...filteredOutstanding].sort((a, b) => {
    if (sortBy === "student") {
      const an = a.studentName.toLowerCase();
      const bn = b.studentName.toLowerCase();
      if (an < bn) return sortDirection === "asc" ? -1 : 1;
      if (an > bn) return sortDirection === "asc" ? 1 : -1;
      return 0;
    }
    const diff = a.balance - b.balance;
    return sortDirection === "asc" ? diff : -diff;
  });

  const totalOutstanding = sortedOutstanding.reduce((s, x) => s + x.balance, 0);
  const totalCollected = sortedOutstanding.reduce((s, x) => s + x.totalPayments, 0);

  const handleSort = (field: "student" | "balance") => {
    setSortDirection((prev) => (sortBy === field && prev === "desc" ? "asc" : "desc"));
    setSortBy(field);
  };

  const openRecordPaymentForRow = (o: FeeLedgerDto) => {
    setPaymentForm({ studentId: o.studentId, amount: String(o.balance), mode: "Cash" });
    setPaymentModalOpen(true);
  };

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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total collected (outstanding list)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-lg font-semibold">{formatCurrency(totalCollected)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-lg font-semibold text-warning">
                {formatCurrency(totalOutstanding)}
              </span>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Outstanding by class
            </CardTitle>
            <CardDescription>
              Students with balance &gt; 0 (scoped by academic year)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={classFilter || "all"}
                  onValueChange={(v) => setClassFilter(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="w-full sm:w-64"
                  placeholder="Search student"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={recalculateOutstanding}
                  disabled={recalculating}
                >
                  {recalculating ? "Generating..." : "Generate outstanding"}
                </Button>
                <Button onClick={() => setPaymentModalOpen(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record payment
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("student")}
                  >
                    Student
                  </TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Fee start</TableHead>
                  <TableHead>Charges</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("balance")}
                  >
                    Balance
                  </TableHead>
                  <TableHead className="w-[90px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOutstanding.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-sm text-muted-foreground"
                    >
                      No outstanding records for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedOutstanding.map((o) => (
                    <TableRow key={o.studentId}>
                      <TableCell>{o.studentName}</TableCell>
                      <TableCell>{o.className ?? "—"}</TableCell>
                      <TableCell>
                        {o.feePaymentStartMonth != null &&
                        o.feePaymentStartMonth >= 1 &&
                        o.feePaymentStartMonth <= 12
                          ? o.feePaymentStartYear != null
                            ? `${FEE_MONTH_NAMES[o.feePaymentStartMonth - 1]} ${o.feePaymentStartYear}`
                            : FEE_MONTH_NAMES[o.feePaymentStartMonth - 1]
                          : "—"}
                      </TableCell>
                      <TableCell>{formatCurrency(o.totalCharges)}</TableCell>
                      <TableCell>{formatCurrency(o.totalPayments)}</TableCell>
                      <TableCell className="font-medium text-warning">
                        {formatCurrency(o.balance)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openRecordPaymentForRow(o)}
                          className="gap-1"
                        >
                          <Banknote className="h-3.5 w-3.5" />
                          Pay
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Record payment</DialogTitle>
                  <DialogDescription>
                    Select student, amount and mode.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRecordPayment} className="space-y-3">
                  <div className="space-y-1">
                    <Label>Student</Label>
                    <Select
                      value={paymentForm.studentId}
                      onValueChange={(v) =>
                        setPaymentForm((f) => ({ ...f, studentId: v }))
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedOutstanding.length > 0
                          ? sortedOutstanding.map((o) => (
                              <SelectItem key={o.studentId} value={o.studentId}>
                                {o.studentName} — {formatCurrency(o.balance)} due
                              </SelectItem>
                            ))
                          : students.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} ({s.admissionNumber})
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm((f) => ({
                          ...f,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="Amount"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Mode</Label>
                    <Select
                      value={paymentForm.mode}
                      onValueChange={(v) =>
                        setPaymentForm((f) => ({ ...f, mode: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="BankTransfer">
                          Bank transfer
                        </SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPaymentModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Record</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
