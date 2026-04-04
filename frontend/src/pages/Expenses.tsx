import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt, Trash2, Plus, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

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
  return `AED ${Number(amount).toLocaleString("en-AE")}`;
}

export default function Expenses() {
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
    loadExpenses();
  }, [expenseDateFrom, expenseDateTo, expenseCategoryFilter]);

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

  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <DashboardHeader title="Expenses" description="Add, edit, and filter school expenses by date range and category." />

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
              <label className="text-sm font-medium">Amount (AED)</label>
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
