import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DollarSign, Plus, Pencil, Trash2, Calendar, CheckCircle, MinusCircle, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

interface UserDto {
  id: string;
  name: string;
  userId: string;
  role: string;
  isActive: boolean;
}

interface TeacherSalaryDto {
  id: string;
  teacherUserId: string;
  teacherName?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  amount: number;
  payFrequency: string;
  currency: string;
  notes?: string;
  createdAt: string;
}

interface TeacherSalaryPaymentLineDto {
  id: string;
  lineType: string;
  description: string;
  amount: number;
}

interface TeacherSalaryPaymentDto {
  id: string;
  teacherUserId: string;
  teacherName?: string;
  year: number;
  month: number;
  baseAmount: number;
  totalAdditions: number;
  totalDeductions: number;
  netAmount: number;
  status: string;
  paidAt?: string;
  notes?: string;
  lines: TeacherSalaryPaymentLineDto[];
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const currentDate = new Date();

export default function AdminSalary() {
  const [teachers, setTeachers] = useState<UserDto[]>([]);
  const [salariesByTeacher, setSalariesByTeacher] = useState<Record<string, TeacherSalaryDto[]>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<TeacherSalaryDto | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [form, setForm] = useState({
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: "",
    amount: "",
    payFrequency: "Monthly",
    currency: "INR",
    notes: "",
  });

  const [payrollYear, setPayrollYear] = useState(currentDate.getFullYear());
  const [payrollMonth, setPayrollMonth] = useState(currentDate.getMonth() + 1);
  const [payments, setPayments] = useState<TeacherSalaryPaymentDto[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [markPaidPayment, setMarkPaidPayment] = useState<TeacherSalaryPaymentDto | null>(null);
  const [lineModalPayment, setLineModalPayment] = useState<TeacherSalaryPaymentDto | null>(null);
  const [lineForm, setLineForm] = useState({ lineType: "Deduction" as "Deduction" | "Addition", description: "", amount: "" });
  const [detailPayment, setDetailPayment] = useState<TeacherSalaryPaymentDto | null>(null);

  const loadTeachers = async () => {
    try {
      const list = (await fetchApi("/Users?role=teacher")) as UserDto[];
      setTeachers(Array.isArray(list) ? list.filter((t) => t.isActive) : []);
    } catch {
      setTeachers([]);
    }
  };

  const loadSalariesForTeacher = async (teacherUserId: string) => {
    try {
      const list = (await fetchApi(`/TeacherSalary/by-teacher/${teacherUserId}`)) as TeacherSalaryDto[];
      setSalariesByTeacher((prev) => ({ ...prev, [teacherUserId]: Array.isArray(list) ? list : [] }));
    } catch {
      setSalariesByTeacher((prev) => ({ ...prev, [teacherUserId]: [] }));
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadTeachers();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    teachers.forEach((t) => loadSalariesForTeacher(t.id));
  }, [teachers]);

  const loadPaymentsForMonth = async () => {
    const y = payrollYear >= 1 && payrollYear <= 9999 ? payrollYear : new Date().getFullYear();
    const m = payrollMonth >= 1 && payrollMonth <= 12 ? payrollMonth : new Date().getMonth() + 1;
    setPaymentsLoading(true);
    try {
      const list = (await fetchApi(`/TeacherSalary/payments?year=${y}&month=${m}`)) as TeacherSalaryPaymentDto[];
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
      await fetchApi("/TeacherSalary/payments", {
        method: "POST",
        body: JSON.stringify({ year: payrollYear, month: payrollMonth }),
      });
      toast({ title: "Payroll generated", description: "Payments created for teachers with current salary." });
      loadPaymentsForMonth();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to generate payroll", variant: "destructive" });
    }
    setGenerateLoading(false);
  };

  const handleMarkPaid = async () => {
    if (!markPaidPayment) return;
    try {
      await fetchApi(`/TeacherSalary/payments/${markPaidPayment.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Paid", paidAt: new Date().toISOString() }),
      });
      toast({ title: "Marked as paid", description: `${markPaidPayment.teacherName}'s payment has been marked paid.` });
      setMarkPaidPayment(null);
      loadPaymentsForMonth();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed", variant: "destructive" });
    }
  };

  const openAddLine = (p: TeacherSalaryPaymentDto, lineType: "Deduction" | "Addition") => {
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
      await fetchApi(`/TeacherSalary/payments/${lineModalPayment.id}/lines`, {
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
      await fetchApi(`/TeacherSalary/payments/${paymentId}/lines/${lineId}`, { method: "DELETE" });
      toast({ title: "Removed", description: "Line removed." });
      loadPaymentsForMonth();
      if (detailPayment?.id === paymentId) setDetailPayment(null);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed", variant: "destructive" });
    }
  };

  const openAdd = (teacherId?: string) => {
    setEditingSalary(null);
    setSelectedTeacherId(teacherId || "");
    setForm({
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: "",
      amount: "",
      payFrequency: "Monthly",
      currency: "INR",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEdit = (s: TeacherSalaryDto) => {
    setEditingSalary(s);
    setSelectedTeacherId(s.teacherUserId);
    setForm({
      effectiveFrom: s.effectiveFrom.slice(0, 10),
      effectiveTo: s.effectiveTo?.slice(0, 10) || "",
      amount: String(s.amount),
      payFrequency: s.payFrequency,
      currency: s.currency,
      notes: s.notes || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const amount = parseFloat(form.amount);
    if (!selectedTeacherId || isNaN(amount) || amount <= 0) {
      toast({ title: "Validation", description: "Select teacher and enter a valid amount.", variant: "destructive" });
      return;
    }
    try {
      if (editingSalary) {
        await fetchApi(`/TeacherSalary/${editingSalary.id}`, {
          method: "PUT",
          body: JSON.stringify({
            effectiveFrom: form.effectiveFrom + "T00:00:00Z",
            effectiveTo: form.effectiveTo ? form.effectiveTo + "T00:00:00Z" : null,
            amount,
            payFrequency: form.payFrequency,
            currency: form.currency,
            notes: form.notes || undefined,
          }),
        });
        toast({ title: "Updated", description: "Salary record updated." });
      } else {
        await fetchApi("/TeacherSalary", {
          method: "POST",
          body: JSON.stringify({
            teacherUserId: selectedTeacherId,
            effectiveFrom: form.effectiveFrom + "T00:00:00Z",
            effectiveTo: form.effectiveTo ? form.effectiveTo + "T00:00:00Z" : null,
            amount,
            payFrequency: form.payFrequency,
            currency: form.currency,
            notes: form.notes || undefined,
          }),
        });
        toast({ title: "Created", description: "Salary record added." });
      }
      setModalOpen(false);
      if (selectedTeacherId) loadSalariesForTeacher(selectedTeacherId);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, teacherUserId: string) => {
    try {
      await fetchApi(`/TeacherSalary/${id}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Salary record removed." });
      loadSalariesForTeacher(teacherUserId);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed", variant: "destructive" });
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    currency === "INR" ? `₹${Number(amount).toLocaleString("en-IN")}` : `${currency} ${Number(amount).toLocaleString()}`;

  const formatPayrollCurrency = (amount: number) => `₹${Number(amount).toLocaleString("en-IN")}`;
  const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleString("en", { month: "short" });

  return (
    <div className="space-y-6">
        <DashboardHeader title="Teacher Salary" description="Manage salary records and monthly payroll" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button onClick={() => openAdd()} className="gap-2">
            <Plus className="h-4 w-4" /> Add salary record
          </Button>
        </div>

        <Card className="rounded-[var(--radius)]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Salary records
            </CardTitle>
            <CardDescription>Set base salary per teacher (effective from/to).</CardDescription>
          </CardHeader>
        </Card>

        {loading ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {teachers.map((teacher) => {
              const salaries = salariesByTeacher[teacher.id] ?? [];
              const current = salaries.find(
                (s) =>
                  !s.effectiveTo ||
                  new Date(s.effectiveTo) >= new Date()
              );
              return (
                <motion.div key={teacher.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="rounded-[var(--radius)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        {teacher.name}
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => openAdd(teacher.id)}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {salaries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No salary records. Add one above.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-medium">Effective from</th>
                                <th className="text-left py-2 font-medium">To</th>
                                <th className="text-right py-2 font-medium">Amount</th>
                                <th className="text-left py-2 font-medium">Frequency</th>
                                <th className="w-24"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {salaries.map((s) => (
                                <tr key={s.id} className="border-b border-border/50 last:border-0">
                                  <td className="py-2">{new Date(s.effectiveFrom).toLocaleDateString()}</td>
                                  <td className="py-2">{s.effectiveTo ? new Date(s.effectiveTo).toLocaleDateString() : "—"}</td>
                                  <td className="py-2 text-right font-medium">{formatCurrency(s.amount, s.currency)}</td>
                                  <td className="py-2">{s.payFrequency}</td>
                                  <td className="py-2 flex gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-3 w-3" /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id, s.teacherUserId)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {teachers.length === 0 && (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No teachers found.</CardContent></Card>
            )}
          </div>
        )}

        <Card className="rounded-[var(--radius)]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Monthly payroll
            </CardTitle>
            <CardDescription>Generate payments for a month, add deductions or increments, and mark as paid.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Year</label>
                <Select value={String(payrollYear)} onValueChange={(v) => setPayrollYear(parseInt(v, 10))}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[currentDate.getFullYear(), currentDate.getFullYear() - 1].map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Month</label>
                <Select value={String(payrollMonth)} onValueChange={(v) => setPayrollMonth(parseInt(v, 10))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={String(m)}>{monthName(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGeneratePayroll} disabled={generateLoading} variant="outline" className="gap-2">
                {generateLoading ? "Generating…" : "Generate payroll for this month"}
              </Button>
            </div>
            {paymentsLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading payments…</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No payments for this month. Generate payroll or add salary records first.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Teacher</th>
                      <th className="text-right p-2 font-medium">Base</th>
                      <th className="text-right p-2 font-medium">Additions</th>
                      <th className="text-right p-2 font-medium">Deductions</th>
                      <th className="text-right p-2 font-medium">Net</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Paid date</th>
                      <th className="w-40 p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 last:border-0">
                        <td className="p-2 font-medium">{p.teacherName ?? p.teacherUserId}</td>
                        <td className="p-2 text-right">{formatPayrollCurrency(p.baseAmount)}</td>
                        <td className="p-2 text-right text-green-600">{formatPayrollCurrency(p.totalAdditions)}</td>
                        <td className="p-2 text-right text-red-600">{formatPayrollCurrency(p.totalDeductions)}</td>
                        <td className="p-2 text-right font-medium">{formatPayrollCurrency(p.netAmount)}</td>
                        <td className="p-2">{p.status}</td>
                        <td className="p-2">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</td>
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
                              <TrendingUp className="h-3 w-3" /> Increment
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

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSalary ? "Edit salary" : "Add salary record"}</DialogTitle>
              <DialogDescription>Effective from/to and amount.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!editingSalary && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teacher</label>
                  <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Effective from</label>
                  <Input type="date" value={form.effectiveFrom} onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Effective to (optional)</label>
                  <Input type="date" value={form.effectiveTo} onChange={(e) => setForm((f) => ({ ...f, effectiveTo: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <Select value={form.payFrequency} onValueChange={(v) => setForm((f) => ({ ...f, payFrequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingSalary ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!markPaidPayment} onOpenChange={(open) => !open && setMarkPaidPayment(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Mark as paid</DialogTitle>
              <DialogDescription>
                {markPaidPayment && `${markPaidPayment.teacherName} — ${monthName(markPaidPayment.month)} ${markPaidPayment.year}. Net: ${formatPayrollCurrency(markPaidPayment.netAmount)}`}
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
              <DialogDescription>{lineModalPayment?.teacherName} — {lineModalPayment && monthName(lineModalPayment.month)} {lineModalPayment?.year}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={lineForm.lineType} onValueChange={(v: "Deduction" | "Addition") => setLineForm((f) => ({ ...f, lineType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deduction">Deduction</SelectItem>
                    <SelectItem value="Addition">Addition (Increment)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={lineForm.description} onChange={(e) => setLineForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Tax, Bonus" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (₹)</label>
                <Input type="number" min="0" step="0.01" value={lineForm.amount} onChange={(e) => setLineForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLineModalPayment(null)}>Cancel</Button>
              <Button onClick={handleAddLine}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!detailPayment} onOpenChange={(open) => !open && setDetailPayment(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Payment details</DialogTitle>
              <DialogDescription>{detailPayment?.teacherName} — {detailPayment && monthName(detailPayment.month)} {detailPayment?.year}. Net: {detailPayment && formatPayrollCurrency(detailPayment.netAmount)}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              {detailPayment?.lines?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deductions or additions.</p>
              ) : (
                detailPayment?.lines?.map((line) => (
                  <div key={line.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span>{line.description} ({line.lineType})</span>
                    <span className={line.lineType === "Deduction" ? "text-red-600" : "text-green-600"}>
                      {line.lineType === "Deduction" ? "-" : "+"}{formatPayrollCurrency(line.amount)}
                    </span>
                    <Button size="sm" variant="ghost" className="text-destructive h-8 w-8 p-0" onClick={() => handleDeleteLine(detailPayment.id, line.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailPayment(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
