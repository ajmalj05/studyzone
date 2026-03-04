import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, CheckCircle, User, Receipt, Trash2, Plus, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const currentDate = new Date();
const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleString("en", { month: "short" });

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
  lines: TeacherSalaryPaymentLineDto[];
}

interface TeacherDto {
  id: string;
  name: string;
  userId?: string;
}

interface SchoolExpenseDto {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

const EXPENSE_CATEGORIES = ["Utilities", "Supplies", "Salaries", "Maintenance", "Other"];

function formatCurrency(amount: number) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export default function AdminSalaryAndExpenses() {
  const [activeTab, setActiveTab] = useState("paid");

  // Paid salaries
  const [paidYearFrom, setPaidYearFrom] = useState(currentDate.getFullYear());
  const [paidYearTo, setPaidYearTo] = useState(currentDate.getFullYear());
  const [paidPayments, setPaidPayments] = useState<TeacherSalaryPaymentDto[]>([]);
  const [paidLoading, setPaidLoading] = useState(false);

  // Teacher-wise
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [teacherPayments, setTeacherPayments] = useState<TeacherSalaryPaymentDto[]>([]);
  const [teacherPaymentsLoading, setTeacherPaymentsLoading] = useState(false);
  const [detailPayment, setDetailPayment] = useState<TeacherSalaryPaymentDto | null>(null);

  // Expenses
  const [expenses, setExpenses] = useState<SchoolExpenseDto[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseDateFrom, setExpenseDateFrom] = useState("");
  const [expenseDateTo, setExpenseDateTo] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>("All");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SchoolExpenseDto | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "Other",
    description: "",
    amount: "",
  });

  const loadPaidSalaries = async () => {
    setPaidLoading(true);
    try {
      const params = new URLSearchParams({
        status: "Paid",
        yearFrom: String(paidYearFrom),
        yearTo: String(paidYearTo),
      });
      const list = (await fetchApi(`/TeacherSalary/payments?${params}`)) as TeacherSalaryPaymentDto[];
      setPaidPayments(Array.isArray(list) ? list : []);
    } catch {
      setPaidPayments([]);
    }
    setPaidLoading(false);
  };

  useEffect(() => {
    if (activeTab === "paid") loadPaidSalaries();
  }, [activeTab, paidYearFrom, paidYearTo]);

  const loadTeachers = async () => {
    try {
      const data = (await fetchApi("/Users?role=teacher")) as TeacherDto[];
      setTeachers(Array.isArray(data) ? data : []);
    } catch {
      setTeachers([]);
    }
  };

  useEffect(() => {
    if (activeTab === "teacher") loadTeachers();
  }, [activeTab]);

  const loadTeacherPayments = async () => {
    if (!selectedTeacherId) {
      setTeacherPayments([]);
      return;
    }
    setTeacherPaymentsLoading(true);
    try {
      const list = (await fetchApi(`/TeacherSalary/payments/by-teacher/${selectedTeacherId}`)) as TeacherSalaryPaymentDto[];
      setTeacherPayments(Array.isArray(list) ? list : []);
    } catch {
      setTeacherPayments([]);
    }
    setTeacherPaymentsLoading(false);
  };

  useEffect(() => {
    if (selectedTeacherId) loadTeacherPayments();
    else setTeacherPayments([]);
  }, [selectedTeacherId]);

  const loadExpenses = async () => {
    setExpensesLoading(true);
    try {
      const params = new URLSearchParams();
      if (expenseDateFrom) params.set("dateFrom", expenseDateFrom);
      if (expenseDateTo) params.set("dateTo", expenseDateTo);
      if (expenseCategoryFilter && expenseCategoryFilter !== "All") params.set("category", expenseCategoryFilter);
      const list = (await fetchApi(`/Expenses?${params}`)) as SchoolExpenseDto[];
      setExpenses(Array.isArray(list) ? list : []);
    } catch {
      setExpenses([]);
    }
    setExpensesLoading(false);
  };

  useEffect(() => {
    if (activeTab === "expenses") loadExpenses();
  }, [activeTab, expenseDateFrom, expenseDateTo, expenseCategoryFilter]);

  const openAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      date: new Date().toISOString().slice(0, 10),
      category: "Other",
      description: "",
      amount: "",
    });
    setExpenseModalOpen(true);
  };

  const openEditExpense = (e: SchoolExpenseDto) => {
    setEditingExpense(e);
    setExpenseForm({
      date: e.date.slice(0, 10),
      category: e.category,
      description: e.description,
      amount: String(e.amount),
    });
    setExpenseModalOpen(true);
  };

  const handleSaveExpense = async () => {
    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Validation", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }
    try {
      if (editingExpense) {
        await fetchApi(`/Expenses/${editingExpense.id}`, {
          method: "PUT",
          body: JSON.stringify({
            date: expenseForm.date + "T00:00:00Z",
            category: expenseForm.category,
            description: expenseForm.description,
            amount,
          }),
        });
        toast({ title: "Updated", description: "Expense updated." });
      } else {
        await fetchApi("/Expenses", {
          method: "POST",
          body: JSON.stringify({
            date: expenseForm.date + "T00:00:00Z",
            category: expenseForm.category,
            description: expenseForm.description,
            amount,
          }),
        });
        toast({ title: "Added", description: "Expense added." });
      }
      setExpenseModalOpen(false);
      loadExpenses();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await fetchApi(`/Expenses/${id}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Expense removed." });
      loadExpenses();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed", variant: "destructive" });
    }
  };

  const paidTotal = paidPayments.reduce((sum, p) => sum + p.netAmount, 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <DashboardHeader title="Salary & Expenses" description="View paid salaries, teacher-wise details, and manage school expenses" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="paid" className="gap-2">
            <CheckCircle className="h-4 w-4" /> Paid Salaries
          </TabsTrigger>
          <TabsTrigger value="teacher" className="gap-2">
            <User className="h-4 w-4" /> Teacher-wise
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <Receipt className="h-4 w-4" /> Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paid" className="space-y-4">
          <Card className="rounded-[var(--radius)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Paid teacher salaries
              </CardTitle>
              <CardDescription>Filter by year range. Only payments with status Paid are shown.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Year from</label>
                  <Select value={String(paidYearFrom)} onValueChange={(v) => setPaidYearFrom(parseInt(v, 10))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[currentDate.getFullYear(), currentDate.getFullYear() - 1, currentDate.getFullYear() - 2].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Year to</label>
                  <Select value={String(paidYearTo)} onValueChange={(v) => setPaidYearTo(parseInt(v, 10))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[currentDate.getFullYear(), currentDate.getFullYear() - 1, currentDate.getFullYear() - 2].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={loadPaidSalaries}>Refresh</Button>
              </div>
              {paidLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading…</p>
              ) : paidPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No paid salaries in the selected range.</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Teacher</TableHead>
                          <TableHead className="text-right">Period</TableHead>
                          <TableHead className="text-right">Base</TableHead>
                          <TableHead className="text-right">Additions</TableHead>
                          <TableHead className="text-right">Deductions</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                          <TableHead>Paid date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paidPayments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.teacherName ?? p.teacherUserId}</TableCell>
                            <TableCell className="text-right">{monthName(p.month)} {p.year}</TableCell>
                            <TableCell className="text-right">{formatCurrency(p.baseAmount)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(p.totalAdditions)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(p.totalDeductions)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(p.netAmount)}</TableCell>
                            <TableCell>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Total paid: {formatCurrency(paidTotal)}</p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teacher" className="space-y-4">
          <Card className="rounded-[var(--radius)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Teacher-wise salary details
              </CardTitle>
              <CardDescription>Select a teacher to view their payment history and line-item details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium">Teacher</label>
                <Select value={selectedTeacherId || "_none"} onValueChange={(v) => setSelectedTeacherId(v === "_none" ? "" : v)}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Select teacher</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {teacherPaymentsLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading…</p>
              ) : !selectedTeacherId ? (
                <p className="text-sm text-muted-foreground py-4">Select a teacher to see payment history.</p>
              ) : teacherPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No payment records for this teacher.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">Additions</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Paid date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherPayments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{monthName(p.month)} {p.year}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.baseAmount)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(p.totalAdditions)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatCurrency(p.totalDeductions)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(p.netAmount)}</TableCell>
                          <TableCell>{p.status}</TableCell>
                          <TableCell>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => setDetailPayment(p)}>Details</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card className="rounded-[var(--radius)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" /> School expenses
              </CardTitle>
              <CardDescription>Add, edit, and filter expenses by date range and category.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">From</label>
                  <Input type="date" value={expenseDateFrom} onChange={(e) => setExpenseDateFrom(e.target.value)} className="w-40" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">To</label>
                  <Input type="date" value={expenseDateTo} onChange={(e) => setExpenseDateTo(e.target.value)} className="w-40" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={loadExpenses}>Apply</Button>
                <Button size="sm" className="gap-1" onClick={openAddExpense}>
                  <Plus className="h-4 w-4" /> Add expense
                </Button>
              </div>
              {expensesLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading…</p>
              ) : expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No expenses match the filter.</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Date</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-24"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                            <TableCell>{e.category}</TableCell>
                            <TableCell>{e.description}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(e.amount)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openEditExpense(e)}><Pencil className="h-3 w-3" /></Button>
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteExpense(e.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Total: {formatCurrency(expenseTotal)}</p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detailPayment} onOpenChange={(open) => !open && setDetailPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment details</DialogTitle>
            <DialogDescription>
              {detailPayment?.teacherName} — {detailPayment && monthName(detailPayment.month)} {detailPayment?.year}. Net: {detailPayment && formatCurrency(detailPayment.netAmount)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {detailPayment?.lines?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deductions or additions.</p>
            ) : (
              detailPayment?.lines?.map((line) => (
                <div key={line.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{line.description} ({line.lineType})</span>
                  <span className={line.lineType === "Deduction" ? "text-red-600" : "text-green-600"}>
                    {line.lineType === "Deduction" ? "-" : "+"}{formatCurrency(line.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailPayment(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit expense" : "Add expense"}</DialogTitle>
            <DialogDescription>Enter date, category, description, and amount.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Electricity bill" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveExpense}>{editingExpense ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
