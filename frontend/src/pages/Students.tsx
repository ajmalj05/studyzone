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
import { Users, ArrowRightLeft } from "lucide-react";

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
  section?: string;
  status: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  feePaymentStartMonth?: number;
  feePaymentStartYear?: number;
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
  section?: string;
  seatLimit?: number;
}

const STATUSES = ["Active", "Inactive", "Transferred", "Withdrawn", "Alumni"];

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
  const [form, setForm] = useState({
    admissionNumber: "",
    name: "",
    dateOfBirth: "",
    gender: "",
    academicYearId: "",
    classId: "",
    batchId: "",
    section: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    address: "",
    feePaymentStartMonth: "",
    feePaymentStartYear: "",
  });
  const [promoteStudentIds, setPromoteStudentIds] = useState<string[]>([]);
  const [promoteTargetAcademicYearId, setPromoteTargetAcademicYearId] = useState("");
  const [promoteTargetClassId, setPromoteTargetClassId] = useState("");
  const [promoteTargetBatchId, setPromoteTargetBatchId] = useState("");
  const [promotionSourceYearId, setPromotionSourceYearId] = useState("");
  const [promotionSourceClassId, setPromotionSourceClassId] = useState("");
  const [promotionSourceBatchId, setPromotionSourceBatchId] = useState("");
  const [promotionSearch, setPromotionSearch] = useState("");
  const [promotionSort, setPromotionSort] = useState<"name" | "class">("name");
  const [promotionStudents, setPromotionStudents] = useState<StudentDto[]>([]);
  const [promotionTotal, setPromotionTotal] = useState(0);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionSourceBatches, setPromotionSourceBatches] = useState<BatchDto[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [newBatchClassId, setNewBatchClassId] = useState("");
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchSection, setNewBatchSection] = useState("");
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load classes", variant: "destructive" });
    }
  };

  const loadBatches = async () => {
    try {
      const url = selectedYearId ? `/Batches?academicYearId=${encodeURIComponent(selectedYearId)}` : "/Batches";
      const list = (await fetchApi(url)) as BatchDto[];
      setBatches(list);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load batches", variant: "destructive" });
    }
  };

  const [promotionBatches, setPromotionBatches] = useState<BatchDto[]>([]);
  const loadPromotionBatches = async () => {
    if (!promoteTargetAcademicYearId) {
      setPromotionBatches([]);
      return;
    }
    try {
      if (promoteTargetClassId) {
        const list = (await fetchApi(`/Batches/by-class/${promoteTargetClassId}?academicYearId=${encodeURIComponent(promoteTargetAcademicYearId)}`)) as BatchDto[];
        setPromotionBatches(list);
      } else {
        const list = (await fetchApi(`/Batches?academicYearId=${encodeURIComponent(promoteTargetAcademicYearId)}`)) as BatchDto[];
        setPromotionBatches(list);
      }
    } catch {
      setPromotionBatches([]);
    }
  };

  const loadPromotionSourceBatches = async () => {
    const yearId = promotionSourceYearId || selectedYearId;
    if (!yearId) {
      setPromotionSourceBatches([]);
      return;
    }
    try {
      if (promotionSourceClassId) {
        const list = (await fetchApi(`/Batches/by-class/${promotionSourceClassId}?academicYearId=${encodeURIComponent(yearId)}`)) as BatchDto[];
        setPromotionSourceBatches(list);
      } else {
        const list = (await fetchApi(`/Batches?academicYearId=${encodeURIComponent(yearId)}`)) as BatchDto[];
        setPromotionSourceBatches(list);
      }
    } catch {
      setPromotionSourceBatches([]);
    }
  };

  const loadPromotionStudents = async () => {
    const yearId = promotionSourceYearId || selectedYearId;
    if (!yearId) {
      setPromotionStudents([]);
      setPromotionTotal(0);
      return;
    }
    setPromotionLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("academicYearId", yearId);
      if (promotionSourceClassId) params.set("classId", promotionSourceClassId);
      if (promotionSourceBatchId) params.set("batchId", promotionSourceBatchId);
      params.set("status", "Active");
      params.set("take", "500");
      const res = (await fetchApi(`/Students?${params.toString()}`)) as { items: StudentDto[]; total: number };
      setPromotionStudents(res.items ?? []);
      setPromotionTotal(res.total ?? 0);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load students", variant: "destructive" });
      setPromotionStudents([]);
      setPromotionTotal(0);
    } finally {
      setPromotionLoading(false);
    }
  };

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
      await loadClasses();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    loadBatches();
  }, [selectedYearId]);

  useEffect(() => {
    loadPromotionBatches();
  }, [promoteTargetAcademicYearId, promoteTargetClassId]);

  useEffect(() => {
    loadPromotionSourceBatches();
  }, [promotionSourceYearId, selectedYearId, promotionSourceClassId]);

  useEffect(() => {
    loadPromotionStudents();
    setPromoteStudentIds([]);
  }, [selectedYearId, promotionSourceYearId, promotionSourceClassId, promotionSourceBatchId]);

  useEffect(() => {
    loadStudents();
  }, [selectedYearId, classFilter, batchFilter, statusFilter]);

  const batchesForClass = classFilter ? batches.filter((b) => b.classId === classFilter) : batches;

  const openAdd = () => {
    setEditingId(null);
    const defaultYearId = selectedYearId || (academicYears.length > 0 ? academicYears[0].id : "");
    setForm({
      admissionNumber: "",
      name: "",
      dateOfBirth: "",
      gender: "",
      academicYearId: defaultYearId,
      classId: "",
      batchId: "",
      section: "",
      guardianName: "",
      guardianPhone: "",
      guardianEmail: "",
      address: "",
      feePaymentStartMonth: "",
      feePaymentStartYear: "",
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
      section: s.section ?? "",
      guardianName: s.guardianName ?? "",
      guardianPhone: s.guardianPhone ?? "",
      guardianEmail: s.guardianEmail ?? "",
      address: "",
      feePaymentStartMonth: s.feePaymentStartMonth != null ? String(s.feePaymentStartMonth) : "",
      feePaymentStartYear: s.feePaymentStartYear != null ? String(s.feePaymentStartYear) : "",
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Validation", description: "Name is required.", variant: "destructive" });
      return;
    }
    try {
      if (editingId) {
        await fetchApi(`/Students/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name,
            dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
            gender: form.gender || undefined,
            academicYearId: form.academicYearId || undefined,
            classId: form.classId || undefined,
            batchId: form.batchId || undefined,
            section: form.section || undefined,
            guardianName: form.guardianName || undefined,
            guardianPhone: form.guardianPhone || undefined,
            guardianEmail: form.guardianEmail || undefined,
            address: form.address || undefined,
            feePaymentStartMonth: form.feePaymentStartMonth ? Number(form.feePaymentStartMonth) : undefined,
            feePaymentStartYear: form.feePaymentStartYear ? Number(form.feePaymentStartYear) : undefined,
          }),
        });
        toast({ title: "Success", description: "Student updated." });
      } else {
        if (!form.classId?.trim()) {
          toast({ title: "Validation", description: "Class is required when adding a student.", variant: "destructive" });
          return;
        }
        await fetchApi("/Students", {
          method: "POST",
          body: JSON.stringify({
            admissionNumber: form.admissionNumber.trim() || undefined,
            name: form.name,
            dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
            gender: form.gender || undefined,
            academicYearId: form.academicYearId || undefined,
            classId: form.classId || undefined,
            batchId: form.batchId || undefined,
            section: form.section || undefined,
            guardianName: form.guardianName || undefined,
            guardianPhone: form.guardianPhone || undefined,
            guardianEmail: form.guardianEmail || undefined,
            address: form.address || undefined,
            feePaymentStartMonth: form.feePaymentStartMonth ? Number(form.feePaymentStartMonth) : undefined,
            feePaymentStartYear: form.feePaymentStartYear ? Number(form.feePaymentStartYear) : undefined,
          }),
        });
        toast({ title: "Success", description: "Student added." });
      }
      setShowForm(false);
      await loadStudents();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Save failed", variant: "destructive" });
    }
  };

  const handleSetStatus = async (id: string, status: string) => {
    try {
      await fetchApi(`/Students/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
      toast({ title: "Success", description: "Status updated." });
      await loadStudents();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleBulkPromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (promoteStudentIds.length === 0 || !promoteTargetClassId) {
      toast({ title: "Validation", description: "Select students and target class.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/Students/bulk-promote", {
        method: "POST",
        body: JSON.stringify({
          studentIds: promoteStudentIds,
          targetAcademicYearId: promoteTargetAcademicYearId || undefined,
          targetClassId: promoteTargetClassId,
          targetBatchId: promoteTargetBatchId || undefined,
        }),
      });
      toast({ title: "Success", description: "Students promoted." });
      setPromoteStudentIds([]);
      setPromoteTargetAcademicYearId("");
      setPromoteTargetClassId("");
      setPromoteTargetBatchId("");
      await loadPromotionStudents();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Promote failed", variant: "destructive" });
    }
  };

  const togglePromoteSelection = (id: string) => {
    setPromoteStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassCode.trim()) {
      toast({ title: "Validation", description: "Name and code required.", variant: "destructive" });
      return;
    }
    try {
      if (editingClassId) {
        await fetchApi(`/Classes/${editingClassId}`, { method: "PUT", body: JSON.stringify({ name: newClassName, code: newClassCode }) });
        toast({ title: "Success", description: "Class updated." });
        setEditingClassId(null);
      } else {
        await fetchApi("/Classes", { method: "POST", body: JSON.stringify({ name: newClassName, code: newClassCode }) });
        toast({ title: "Success", description: "Class created." });
      }
      setNewClassName(""); setNewClassCode("");
      setClassModalOpen(false);
      await loadClasses();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const openAddClass = () => {
    setEditingClassId(null);
    setNewClassName(""); setNewClassCode("");
    setClassModalOpen(true);
  };

  const openEditClass = (c: ClassDto) => {
    setEditingClassId(c.id);
    setNewClassName(c.name);
    setNewClassCode(c.code);
    setClassModalOpen(true);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const academicYearId = editingBatchId
      ? (batches.find((b) => b.id === editingBatchId)?.academicYearId ?? selectedYearId)
      : selectedYearId;
    if (!newBatchClassId || !newBatchName.trim() || !academicYearId) {
      toast({ title: "Validation", description: "Select academic year, class and batch name.", variant: "destructive" });
      return;
    }
    try {
      const payload = { classId: newBatchClassId, academicYearId, name: newBatchName, section: newBatchSection || undefined };
      if (editingBatchId) {
        await fetchApi(`/Batches/${editingBatchId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await fetchApi("/Batches", { method: "POST", body: JSON.stringify(payload) });
      }
      toast({ title: "Success", description: editingBatchId ? "Batch updated." : "Batch created." });
      setBatchModalOpen(false);
      setNewBatchClassId("");
      setNewBatchName("");
      setNewBatchSection("");
      setEditingBatchId(null);
      await loadBatches();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const openAddBatch = () => {
    setEditingBatchId(null);
    setNewBatchClassId(""); setNewBatchName(""); setNewBatchSection("");
    setBatchModalOpen(true);
  };

  const openEditBatch = (b: BatchDto) => {
    setEditingBatchId(b.id);
    setNewBatchClassId(b.classId);
    setNewBatchName(b.name);
    setNewBatchSection(b.section ?? "");
    setBatchModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DashboardHeader title="Student Management" description={`Total: ${total}`} />
          <CurrentAcademicYearBadge />
        </div>
        <div className="space-y-4">
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Students
              </TabsTrigger>
              <TabsTrigger value="promotion" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" /> Promotion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-3">
              <Card>
                <CardHeader>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>List with filters by class, batch, and status. Total: {total}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Select value={classFilter || "all"} onValueChange={(v) => { setClassFilter(v === "all" ? "" : v); setBatchFilter(""); }}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Class" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All classes</SelectItem>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                    </Select>
                    <Select value={batchFilter || "all"} onValueChange={(v) => setBatchFilter(v === "all" ? "" : v)}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Batch" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All batches</SelectItem>{batchesForClass.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
                    </Select>
                    <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                      <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All</SelectItem>{STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                    </Select>
                    <Button onClick={openAdd}>Add student</Button>
                  </div>
                  <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingId ? "Edit student" : "Add student"}</DialogTitle>
                        <DialogDescription>Student details and guardian information.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSave} className="space-y-3">
                        {!editingId && (
                          <div className="space-y-1"><Label>Admission number</Label><Input value={form.admissionNumber} onChange={(e) => setForm((f) => ({ ...f, admissionNumber: e.target.value }))} placeholder="Auto (001, 002, …) if left blank" /></div>
                        )}
                        {currentYear && (
                          <div className="space-y-1">
                            <Label>Academic year</Label>
                            <p className="text-sm text-muted-foreground py-1.5">{currentYear.name}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
                          <div className="space-y-1"><Label>DOB</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Gender</Label><Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                          <div className="space-y-1"><Label>Class *</Label><Select value={form.classId} onValueChange={(v) => setForm((f) => ({ ...f, classId: v, batchId: "" }))}><SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger><SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select></div>
                          <div className="space-y-1"><Label>Batch</Label><Select value={form.batchId} onValueChange={(v) => setForm((f) => ({ ...f, batchId: v }))}><SelectTrigger><SelectValue placeholder="Batch" /></SelectTrigger><SelectContent>{batches.filter((b) => b.classId === form.classId).map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent></Select></div>
                          <div className="space-y-1"><Label>Section</Label><Input value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} /></div>
                          <div className="space-y-1 col-span-2"><Label>Guardian name</Label><Input value={form.guardianName} onChange={(e) => setForm((f) => ({ ...f, guardianName: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Guardian phone</Label><Input value={form.guardianPhone} onChange={(e) => setForm((f) => ({ ...f, guardianPhone: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Guardian email</Label><Input type="email" value={form.guardianEmail} onChange={(e) => setForm((f) => ({ ...f, guardianEmail: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Fees start month</Label><Select value={form.feePaymentStartMonth || "none"} onValueChange={(v) => setForm((f) => ({ ...f, feePaymentStartMonth: v === "none" ? "" : v }))}><SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger><SelectContent><SelectItem value="none">Not set</SelectItem>{MONTH_NAMES.map((name, i) => (<SelectItem key={i} value={String(i + 1)}>{name}</SelectItem>))}</SelectContent></Select></div>
                          <div className="space-y-1"><Label>Fees start year</Label><Select value={form.feePaymentStartYear || "none"} onValueChange={(v) => setForm((f) => ({ ...f, feePaymentStartYear: v === "none" ? "" : v }))}><SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger><SelectContent><SelectItem value="none">Not set</SelectItem>{[new Date().getFullYear() + 1, new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent></Select></div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                          <Button type="submit">Save</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Table>
                    <TableHeader><TableRow><TableHead>Admission #</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Batch</TableHead><TableHead>Fee start</TableHead><TableHead>Status</TableHead><TableHead>Guardian</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {students.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.admissionNumber}</TableCell>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.className ?? "—"}</TableCell>
                          <TableCell>{s.batchName ?? "—"}</TableCell>
                          <TableCell>{s.feePaymentStartMonth != null && s.feePaymentStartMonth >= 1 && s.feePaymentStartMonth <= 12 ? (s.feePaymentStartYear != null ? `${MONTH_NAMES[s.feePaymentStartMonth - 1]} ${s.feePaymentStartYear}` : MONTH_NAMES[s.feePaymentStartMonth - 1]) : "—"}</TableCell>
                          <TableCell>
                            <Select value={s.status} onValueChange={(v) => handleSetStatus(s.id, v)}>
                              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                              <SelectContent>{STATUSES.map((st) => (<SelectItem key={st} value={st}>{st}</SelectItem>))}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{s.guardianName ?? s.guardianPhone ?? "—"}</TableCell>
                          <TableCell><Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promotion" className="space-y-4">
              {(() => {
                const promotionSearchLower = promotionSearch.trim().toLowerCase();
                const filtered = promotionSearchLower
                  ? promotionStudents.filter(
                      (s) =>
                        s.name.toLowerCase().includes(promotionSearchLower) ||
                        (s.admissionNumber ?? "").toLowerCase().includes(promotionSearchLower)
                    )
                  : promotionStudents;
                const sorted = [...filtered].sort((a, b) => {
                  if (promotionSort === "name") return (a.name || "").localeCompare(b.name || "");
                  return (a.className ?? "").localeCompare(b.className ?? "") || (a.batchName ?? "").localeCompare(b.batchName ?? "");
                });
                const visibleStudentIds = sorted.map((s) => s.id);
                const effectiveSourceYearId = promotionSourceYearId || selectedYearId;
                const sourceBatchesForClass = promotionSourceClassId
                  ? promotionSourceBatches.filter((b) => b.classId === promotionSourceClassId)
                  : promotionSourceBatches;
                return (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>1. Filter and select students</CardTitle>
                        <CardDescription>Narrow down current students by year, class, and batch; then select who to promote.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-4 items-end">
                          <div className="space-y-1">
                            <Label>Source academic year</Label>
                            <Select
                              value={effectiveSourceYearId || "none"}
                              onValueChange={(v) => setPromotionSourceYearId(v === "none" ? "" : v)}
                            >
                              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Year" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select year</SelectItem>
                                {academicYears.map((y) => (<SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label>Source class</Label>
                            <Select
                              value={promotionSourceClassId || "all"}
                              onValueChange={(v) => { setPromotionSourceClassId(v === "all" ? "" : v); setPromotionSourceBatchId(""); }}
                            >
                              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Class" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All classes</SelectItem>
                                {classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label>Source batch</Label>
                            <Select
                              value={promotionSourceBatchId || "all"}
                              onValueChange={(v) => setPromotionSourceBatchId(v === "all" ? "" : v)}
                            >
                              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Batch" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All batches</SelectItem>
                                {sourceBatchesForClass.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label>Search by name</Label>
                            <Input
                              placeholder="Name or admission #"
                              className="w-[180px]"
                              value={promotionSearch}
                              onChange={(e) => setPromotionSearch(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Sort</Label>
                            <Select value={promotionSort} onValueChange={(v: "name" | "class") => setPromotionSort(v)}>
                              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="name">Name A–Z</SelectItem>
                                <SelectItem value="class">Class & batch</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setPromoteStudentIds(visibleStudentIds)}>
                              Select all
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setPromoteStudentIds([])}>
                              Clear selection
                            </Button>
                          </div>
                        </div>
                        <div className="max-h-60 overflow-auto border rounded p-2">
                          {promotionLoading ? (
                            <p className="text-muted-foreground py-4 text-center">Loading students…</p>
                          ) : sorted.length === 0 ? (
                            <p className="text-muted-foreground py-4 text-center">
                              {!effectiveSourceYearId ? "Select source academic year." : promotionStudents.length === 0 ? "No active students match the filters." : "No students match the search."}
                            </p>
                          ) : (
                            sorted.map((s) => (
                              <label key={s.id} className="flex items-center gap-2 py-1 cursor-pointer">
                                <input type="checkbox" checked={promoteStudentIds.includes(s.id)} onChange={() => togglePromoteSelection(s.id)} />
                                <span>{s.name} – {s.className ?? "—"} / {s.batchName ?? "—"}</span>
                              </label>
                            ))
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Showing {sorted.length} of {promotionTotal} active student(s). Selected: {promoteStudentIds.length}.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>2. Choose target and promote</CardTitle>
                        <CardDescription>Set target academic year, class, and batch; then promote the selected students.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleBulkPromote} className="space-y-4">
                          <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-1">
                              <Label>Target academic year</Label>
                              <Select value={promoteTargetAcademicYearId} onValueChange={setPromoteTargetAcademicYearId}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Year" /></SelectTrigger>
                                <SelectContent>{academicYears.map((y) => (<SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Target class</Label>
                              <Select value={promoteTargetClassId} onValueChange={(v) => { setPromoteTargetClassId(v); setPromoteTargetBatchId(""); }}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Class" /></SelectTrigger>
                                <SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Target batch</Label>
                              <Select value={promoteTargetBatchId} onValueChange={setPromoteTargetBatchId}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Batch" /></SelectTrigger>
                                <SelectContent>{promotionBatches.filter((b) => b.classId === promoteTargetClassId).map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            <Button type="submit" disabled={promoteStudentIds.length === 0 || !promoteTargetClassId}>
                              Promote selected ({promoteStudentIds.length})
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}
