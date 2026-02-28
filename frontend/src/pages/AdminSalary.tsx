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
import { DollarSign, Plus, Pencil, Trash2 } from "lucide-react";
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

  return (
    <div className="space-y-4">
        <DashboardHeader title="Teacher Salary" description="Manage salary records for teachers" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button onClick={() => openAdd()} className="gap-2">
            <Plus className="h-4 w-4" /> Add salary record
          </Button>
        </div>

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
      </div>
  );
}
