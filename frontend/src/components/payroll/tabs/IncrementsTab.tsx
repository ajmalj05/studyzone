import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { TeacherDto, TeacherSalaryDto, formatPayrollCurrency } from "@/types/payroll";
import { TrendingUp } from "lucide-react";

export function IncrementsTab() {
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [salaryRows, setSalaryRows] = useState<TeacherSalaryDto[]>([]);
  const [newAmount, setNewAmount] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentSalary = useMemo(() => {
    const today = new Date();
    return salaryRows.find((row) => {
      const from = new Date(row.effectiveFrom);
      const to = row.effectiveTo ? new Date(row.effectiveTo) : null;
      return from <= today && (!to || to >= today);
    }) ?? salaryRows[0];
  }, [salaryRows]);

  useEffect(() => {
    fetchApi("/Users?role=teacher")
      .then((list: unknown) => setTeachers(Array.isArray(list) ? (list as TeacherDto[]) : []))
      .catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    if (!selectedTeacherId) {
      setSalaryRows([]);
      return;
    }
    setLoading(true);
    fetchApi(`/TeacherSalary/by-teacher/${selectedTeacherId}`)
      .then((list: unknown) => setSalaryRows(Array.isArray(list) ? (list as TeacherSalaryDto[]) : []))
      .catch(() => setSalaryRows([]))
      .finally(() => setLoading(false));
  }, [selectedTeacherId]);

  const submitIncrement = async () => {
    if (!selectedTeacherId) {
      toast({ title: "Select teacher", description: "Choose a teacher first.", variant: "destructive" });
      return;
    }
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Validation", description: "Enter a valid new salary amount.", variant: "destructive" });
      return;
    }
    if (!effectiveFrom) {
      toast({ title: "Validation", description: "Effective from date is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await fetchApi("/TeacherSalary", {
        method: "POST",
        body: JSON.stringify({
          teacherUserId: selectedTeacherId,
          amount,
          effectiveFrom: new Date(effectiveFrom).toISOString(),
          effectiveTo: null,
          payFrequency: "Monthly",
          currency: "AED",
          notes: notes || null,
        }),
      });
      toast({ title: "Increment applied", description: "New salary revision has been created." });
      setNewAmount("");
      setNotes("");
      const list = (await fetchApi(`/TeacherSalary/by-teacher/${selectedTeacherId}`)) as TeacherSalaryDto[];
      setSalaryRows(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Could not apply increment.", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Card className="rounded-[var(--radius)]">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Increments</CardTitle>
        <CardDescription>Create permanent salary revisions with effective dates.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Teacher</Label>
            <SearchableSelect
              value={selectedTeacherId || "_none"}
              onValueChange={(v) => setSelectedTeacherId(v === "_none" ? "" : v)}
              placeholder="Select teacher"
              options={[
                { value: "_none", label: "Select teacher" },
                ...teachers.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>
          <div className="rounded-lg border px-3 py-2 text-sm bg-muted/20">
            {loading ? "Loading current salary..." : currentSalary
              ? `Current salary: ${formatPayrollCurrency(currentSalary.amount)}`
              : "No current salary set"}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>New salary amount (AED)</Label>
            <Input type="number" min="0" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Effective from</Label>
            <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={submitIncrement} disabled={saving}>{saving ? "Applying..." : "Apply increment"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
