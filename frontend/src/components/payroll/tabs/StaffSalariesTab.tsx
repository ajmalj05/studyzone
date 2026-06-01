import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { StaffDto, StaffSalaryDto, formatPayrollCurrency } from "@/types/payroll";
import { UserPlus } from "lucide-react";

function toDateInput(date?: string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

interface SalaryFormState {
  amount: string;
  effectiveFrom: string;
  effectiveTo: string;
  notes: string;
}

const initialForm: SalaryFormState = {
  amount: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
  notes: "",
};

export function StaffSalariesTab() {
  const [staffs, setStaffs] = useState<StaffDto[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [salaryRows, setSalaryRows] = useState<StaffSalaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<StaffSalaryDto | null>(null);
  const [form, setForm] = useState<SalaryFormState>(initialForm);
  const [saving, setSaving] = useState(false);

  const selectedStaff = useMemo(
    () => staffs.find((s) => s.id === selectedStaffId),
    [selectedStaffId, staffs],
  );

  const loadStaffs = async () => {
    try {
      const list = (await fetchApi("/Users?role=staff")) as StaffDto[];
      setStaffs(Array.isArray(list) ? list : []);
    } catch {
      setStaffs([]);
    }
  };

  const loadSalaries = async () => {
    if (!selectedStaffId) {
      setSalaryRows([]);
      return;
    }
    setLoading(true);
    try {
      const list = (await fetchApi(`/StaffSalary/by-staff/${selectedStaffId}`)) as StaffSalaryDto[];
      setSalaryRows(Array.isArray(list) ? list : []);
    } catch {
      setSalaryRows([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStaffs();
  }, []);

  useEffect(() => {
    loadSalaries();
  }, [selectedStaffId]);

  const openCreateDialog = () => {
    if (!selectedStaffId) {
      toast({ title: "Select staff", description: "Choose a staff member first.", variant: "destructive" });
      return;
    }
    setForm(initialForm);
    setEditing(null);
    setOpenCreate(true);
  };

  const openEditDialog = (row: StaffSalaryDto) => {
    setEditing(row);
    setForm({
      amount: String(row.amount),
      effectiveFrom: toDateInput(row.effectiveFrom),
      effectiveTo: toDateInput(row.effectiveTo),
      notes: row.notes ?? "",
    });
    setOpenCreate(true);
  };

  const submitSalary = async () => {
    if (!selectedStaffId) return;
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Validation", description: "Enter a valid salary amount.", variant: "destructive" });
      return;
    }
    if (!form.effectiveFrom) {
      toast({ title: "Validation", description: "Effective from date is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        staffUserId: selectedStaffId,
        amount,
        effectiveFrom: new Date(form.effectiveFrom).toISOString(),
        effectiveTo: form.effectiveTo ? new Date(form.effectiveTo).toISOString() : null,
        payFrequency: "Monthly",
        currency: "AED",
        notes: form.notes || null,
      };
      if (editing) {
        await fetchApi(`/StaffSalary/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "Salary updated", description: "Staff salary record updated." });
      } else {
        await fetchApi("/StaffSalary", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Salary added", description: "Staff salary record created." });
      }
      setOpenCreate(false);
      loadSalaries();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Could not save salary.", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <>
      <Card className="rounded-[var(--radius)]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-base">Staff salaries</CardTitle>
            <CardDescription>Set and manage staff' base salary slabs.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <SearchableSelect
              value={selectedStaffId || "_none"}
              onValueChange={(v) => setSelectedStaffId(v === "_none" ? "" : v)}
              className="w-72"
              placeholder="Select staff member"
              options={[
                { value: "_none", label: "Select staff member" },
                ...staffs.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <Button onClick={openCreateDialog} className="gap-2">
              <UserPlus className="h-4 w-4" /> Add salary
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedStaffId ? (
            <p className="text-sm text-muted-foreground py-4">Select a staff member to view salary setup.</p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading salary records...</p>
          ) : salaryRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No salary records yet for {selectedStaff?.name ?? "this staff member"}.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Amount</th>
                    <th className="text-left p-2 font-medium">Effective from</th>
                    <th className="text-left p-2 font-medium">Effective to</th>
                    <th className="text-left p-2 font-medium">Notes</th>
                    <th className="p-2 w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {salaryRows.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 last:border-0">
                      <td className="p-2 font-medium">{formatPayrollCurrency(row.amount)}</td>
                      <td className="p-2">{new Date(row.effectiveFrom).toLocaleDateString()}</td>
                      <td className="p-2">{row.effectiveTo ? new Date(row.effectiveTo).toLocaleDateString() : "Open ended"}</td>
                      <td className="p-2">{row.notes || "-"}</td>
                      <td className="p-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(row)}>Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit salary record" : "Add salary record"}</DialogTitle>
            <DialogDescription>{selectedStaff?.name ?? "Staff Member"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount (AED)</Label>
              <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Effective from</Label>
                <Input type="date" value={form.effectiveFrom} onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Effective to</Label>
                <Input type="date" value={form.effectiveTo} onChange={(e) => setForm((f) => ({ ...f, effectiveTo: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={submitSalary} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
