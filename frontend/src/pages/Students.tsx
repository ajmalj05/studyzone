import { useState, useEffect } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
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
import { ArrowRightLeft, Pencil } from "lucide-react";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface StudentDto {
  id: string;
  admissionNumber: string;
  name: string;
  dateOfBirth?: string;
  gender?: string;
  academicYearId?: string;
  academicYearName?: string;
  classId?: string;
  className?: string;
  batchId?: string;
  batchName?: string;
  status: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  feePaymentStartMonth?: number;
  feePaymentStartYear?: number;
  busFeeAmount?: number;
  createdAt: string;
}

interface ClassDto {
  id: string;
  name: string;
  code: string;
}

interface BatchDto {
  id: string;
  classId: string;
  className: string;
  academicYearId?: string;
  name: string;
  seatLimit?: number;
}

const STATUSES = ["Active", "Inactive", "Transferred", "Withdrawn", "Alumni"];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; variant: "success" | "secondary" | "warning" | "destructive" | "violet" }> = {
    Active: { label: "Active", variant: "success" },
    Inactive: { label: "Inactive", variant: "secondary" },
    Transferred: { label: "Transferred", variant: "warning" },
    Withdrawn: { label: "Withdrawn", variant: "destructive" },
    Alumni: { label: "Alumni", variant: "violet" },
  };
  return variants[status] || { label: status, variant: "secondary" };
};

export default function Students() {
  const { selectedYearId, academicYears, currentYear } = useAcademicYear();
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState<string>("");
  const [batchFilter, setBatchFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    admissionNumber: "",
    name: "",
    dateOfBirth: "",
    gender: "",
    academicYearId: "",
    classId: "",
    batchId: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    address: "",
    feePaymentStartMonth: "",
    feePaymentStartYear: "",
    busFeeAmount: "",
  });

  const loadStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedYearId) params.set("academicYearId", selectedYearId);
      if (classFilter) params.set("classId", classFilter);
      if (batchFilter) params.set("batchId", batchFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("take", "100");
      const res = (await fetchApi(`/Students?${params.toString()}`)) as { items: StudentDto[]; total: number };
      setStudents(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load students", variant: "destructive" });
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        fetchApi("/Classes").then((list) => setClasses(list as ClassDto[])),
        fetchApi(selectedYearId ? `/Batches?academicYearId=${encodeURIComponent(selectedYearId)}` : "/Batches").then((list) => setBatches(list as BatchDto[])),
      ]);
      setLoading(false);
    })();
  }, [selectedYearId]);

  useEffect(() => {
    loadStudents();
  }, [selectedYearId, classFilter, batchFilter, statusFilter]);

  const batchesForClass = classFilter ? batches.filter((b) => b.classId === classFilter) : batches;

  // Student table columns
  const studentColumns: DataTableColumn<StudentDto>[] = [
    {
      key: "admissionNumber",
      header: "Admission #",
      cell: (s) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{s.admissionNumber}</span>,
    },
    {
      key: "name",
      header: "Name",
      cell: (s) => <span className="font-semibold text-slate-700 dark:text-slate-200">{s.name}</span>,
    },
    {
      key: "class",
      header: "Class",
      badge: (s) => s.className ? { label: s.className, variant: "info" } : null,
    },
    {
      key: "batch",
      header: "Batch",
      cell: (s) => <span className="text-slate-600 dark:text-slate-400">{s.batchName ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      badge: (s) => {
        const badge = getStatusBadge(s.status);
        return { label: badge.label, variant: badge.variant };
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-[80px]",
      cell: (s) => (
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEdit(s)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  const openAdd = () => {
    setEditingId(null);
    setForm({
      admissionNumber: "",
      name: "",
      dateOfBirth: "",
      gender: "",
      academicYearId: selectedYearId || (academicYears.length > 0 ? academicYears[0].id : ""),
      classId: "",
      batchId: "",
      guardianName: "",
      guardianPhone: "",
      guardianEmail: "",
      address: "",
      feePaymentStartMonth: "",
      feePaymentStartYear: "",
      busFeeAmount: "",
    });
    setShowForm(true);
  };

  const openEdit = (s: StudentDto) => {
    setEditingId(s.id);
    setForm({
      admissionNumber: s.admissionNumber,
      name: s.name,
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : "",
      gender: s.gender ?? "",
      academicYearId: s.academicYearId ?? selectedYearId ?? "",
      classId: s.classId ?? "",
      batchId: s.batchId ?? "",
      guardianName: s.guardianName ?? "",
      guardianPhone: s.guardianPhone ?? "",
      guardianEmail: s.guardianEmail ?? "",
      address: "",
      feePaymentStartMonth: s.feePaymentStartMonth != null ? String(s.feePaymentStartMonth) : "",
      feePaymentStartYear: s.feePaymentStartYear != null ? String(s.feePaymentStartYear) : "",
      busFeeAmount: s.busFeeAmount != null ? String(s.busFeeAmount) : "",
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Validation", description: "Name is required.", variant: "destructive" });
      return;
    }
    if (!form.classId) {
      toast({ title: "Validation", description: "Class is required.", variant: "destructive" });
      return;
    }

    const selectedBatch = form.batchId ? batches.find((b) => b.id === form.batchId) : null;
    if (selectedBatch && selectedBatch.classId !== form.classId) {
      toast({ title: "Validation", description: "Selected batch does not belong to the selected class.", variant: "destructive" });
      return;
    }

    const payload = {
      academicYearId: form.academicYearId || selectedYearId || currentYear?.id,
      admissionNumber: form.admissionNumber.trim(),
      name: form.name.trim(),
      dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth + "T12:00:00").toISOString() : null,
      gender: form.gender || null,
      classId: form.classId || null,
      batchId: form.batchId || null,
      guardianName: form.guardianName.trim() || null,
      guardianPhone: form.guardianPhone.trim() || null,
      guardianEmail: form.guardianEmail.trim() || null,
      address: form.address.trim() || null,
      feePaymentStartMonth: form.feePaymentStartMonth ? parseInt(form.feePaymentStartMonth, 10) : null,
      feePaymentStartYear: form.feePaymentStartYear ? parseInt(form.feePaymentStartYear, 10) : null,
      busFeeAmount: form.busFeeAmount ? Number(form.busFeeAmount) : null,
    };

    try {
      if (editingId) {
        await fetchApi(`/Students/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/Students", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      toast({ title: "Saved", description: "Student saved successfully" });
      setShowForm(false);
      await loadStudents();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to save student", variant: "destructive" });
    }
  };

  usePageHeaderConfigEffect(
    { title: "Student management", description: `Total: ${total}` },
    [total],
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Students</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SearchableSelect
                  value={classFilter || "all"}
                  onValueChange={(v) => { setClassFilter(v === "all" ? "" : v); setBatchFilter(""); }}
                  placeholder="Class"
                  className="w-[160px]"
                  options={[{ value: "all", label: "All classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
                />
                <SearchableSelect
                  value={batchFilter || "all"}
                  onValueChange={(v) => setBatchFilter(v === "all" ? "" : v)}
                  placeholder="Batch"
                  className="w-[160px]"
                  options={[{ value: "all", label: "All batches" }, ...batchesForClass.map((b) => ({ value: b.id, label: b.name }))]}
                />
                <SearchableSelect
                  value={statusFilter || "all"}
                  onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
                  placeholder="Status"
                  className="w-[140px]"
                  options={[{ value: "all", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
                />
                <Button onClick={openAdd}>Add student</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">

              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingId ? "Edit student" : "Add student"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSave} className="space-y-3">
                    {/* Form fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
                      <div className="space-y-1"><Label>DOB</Label><DatePicker value={form.dateOfBirth} onChange={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))} placeholder="Select date of birth" /></div>
                      <div className="space-y-1"><Label>Gender</Label><SearchableSelect value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))} options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} /></div>
                      <div className="space-y-1"><Label>Class *</Label><SearchableSelect value={form.classId} onValueChange={(v) => setForm((f) => ({ ...f, classId: v, batchId: "" }))} placeholder="Class" options={classes.map((c) => ({ value: c.id, label: c.name }))} /></div>
                      <div className="space-y-1"><Label>Batch</Label><SearchableSelect value={form.batchId} onValueChange={(v) => setForm((f) => ({ ...f, batchId: v }))} placeholder="Batch" options={batches.filter((b) => b.classId === form.classId).map((b) => ({ value: b.id, label: b.name }))} /></div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                      <Button type="submit">Save</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* DataTable Component */}
              <DataTable
                data={students}
                columns={studentColumns}
                keyExtractor={(s) => s.id}
                emptyMessage="No students found"
                emptyDescription="Try adjusting filters or add a new student"
              />
            </CardContent>
          </Card>
      </div>
    </div>
  );
}