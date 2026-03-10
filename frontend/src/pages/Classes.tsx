import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { BookOpen, Users, DollarSign, CalendarDays, Pencil } from "lucide-react";

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
  academicYearName?: string;
  name: string;
  section?: string;
  seatLimit?: number;
  classTeacherUserId?: string;
  classTeacherName?: string;
}

interface TeacherUserDto {
  id: string;
  name: string;
  userId: string;
  role: string;
}

export default function Classes() {
  const navigate = useNavigate();
  const { selectedYearId, currentYear } = useAcademicYear();
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFormOpen, setClassFormOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classForm, setClassForm] = useState({ name: "", code: "" });
  const [batchFormOpen, setBatchFormOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [batchForm, setBatchForm] = useState({ classId: "", academicYearId: "", name: "", section: "", seatLimit: 40, classTeacherUserId: "" });
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherUserDto[]>([]);

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

  useEffect(() => {
    (async () => {
      try {
        const list = (await fetchApi("/Users?role=teacher")) as TeacherUserDto[];
        setTeachers(Array.isArray(list) ? list : []);
      } catch {
        setTeachers([]);
      }
    })();
  }, []);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadBatches();
      setLoading(false);
    })();
  }, [selectedYearId]);

  const batchesFiltered = selectedClassId
    ? batches.filter((b) => b.classId === selectedClassId)
    : batches;

  const openAddClass = () => {
    setEditingClassId(null);
    setClassForm({ name: "", code: "" });
    setClassFormOpen(true);
  };

  const openEditClass = (c: ClassDto) => {
    setEditingClassId(c.id);
    setClassForm({ name: c.name, code: c.code });
    setClassFormOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim() || !classForm.code.trim()) {
      toast({ title: "Validation", description: "Name and code required.", variant: "destructive" });
      return;
    }
    try {
      if (editingClassId) {
        await fetchApi(`/Classes/${editingClassId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: classForm.name,
            code: classForm.code,
          }),
        });
        toast({ title: "Success", description: "Class updated." });
      } else {
        await fetchApi("/Classes", {
          method: "POST",
          body: JSON.stringify({
            name: classForm.name,
            code: classForm.code,
          }),
        });
        toast({ title: "Success", description: "Class created." });
      }
      setClassFormOpen(false);
      await loadClasses();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const openAddBatch = () => {
    setEditingBatchId(null);
    setBatchForm({
      classId: classes[0]?.id ?? "",
      academicYearId: selectedYearId,
      name: "",
      section: "",
      seatLimit: 40,
      classTeacherUserId: "",
    });
    setBatchFormOpen(true);
  };

  const openEditBatch = (b: BatchDto) => {
    setEditingBatchId(b.id);
    setBatchForm({
      classId: b.classId,
      academicYearId: b.academicYearId ?? selectedYearId,
      name: b.name,
      section: b.section ?? "",
      seatLimit: b.seatLimit ?? 40,
      classTeacherUserId: b.classTeacherUserId ?? "",
    });
    setBatchFormOpen(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.classId || !batchForm.name.trim()) {
      toast({ title: "Validation", description: "Class and batch name required.", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        classId: batchForm.classId,
        academicYearId: batchForm.academicYearId || selectedYearId,
        name: batchForm.name,
        section: batchForm.section || undefined,
        seatLimit: batchForm.seatLimit,
        classTeacherUserId: batchForm.classTeacherUserId || undefined,
      };
      if (editingBatchId) {
        await fetchApi(`/Batches/${editingBatchId}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "Success", description: "Batch updated." });
      } else {
        await fetchApi("/Batches", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Success", description: "Batch created." });
      }
      setBatchFormOpen(false);
      await loadBatches();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DashboardHeader title="Class & Batch Management" />
        <CurrentAcademicYearBadge />
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Classes
            </CardTitle>
            <CardDescription>Create and edit classes. No delete (in use).</CardDescription>
            <div>
              <Button onClick={openAddClass}>Add class</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={classFormOpen} onOpenChange={setClassFormOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingClassId ? "Edit class" : "Add class"}</DialogTitle>
                  <DialogDescription>Name and code. Seat limit is set per batch.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveClass} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Name *</Label>
                      <Input value={classForm.name} onChange={(e) => setClassForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Grade 8" />
                    </div>
                    <div className="space-y-1">
                      <Label>Code *</Label>
                      <Input value={classForm.code} onChange={(e) => setClassForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. G8" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setClassFormOpen(false)}>Cancel</Button>
                    <Button type="submit">{editingClassId ? "Update" : "Create"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.code}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openEditClass(c)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="ml-1" onClick={() => navigate(`/admin/students?classId=${c.id}`)}>
                        <Users className="h-3 w-3 mr-1" /> Students
                      </Button>
                      <Button size="sm" variant="ghost" className="ml-1" onClick={() => navigate(`/admin/fees`)}>
                        <DollarSign className="h-3 w-3 mr-1" /> Fees
                      </Button>
                      <Button size="sm" variant="ghost" className="ml-1" onClick={() => navigate(`/admin/timetable`)}>
                        <CalendarDays className="h-3 w-3 mr-1" /> Timetable
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batches</CardTitle>
            <CardDescription>Batches are scoped by academic year. Create and edit batches for the current year.</CardDescription>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={selectedClassId ?? "all"} onValueChange={(v) => setSelectedClassId(v === "all" ? null : v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button onClick={openAddBatch}>Add batch</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={batchFormOpen} onOpenChange={setBatchFormOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingBatchId ? "Edit batch" : "Add batch"}</DialogTitle>
                  <DialogDescription>Class, batch name, section and seat limit (per batch).</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveBatch} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {!editingBatchId && currentYear && (
                      <div className="space-y-1 sm:col-span-2">
                        <Label>Academic year</Label>
                        <p className="text-sm text-muted-foreground py-1.5">{currentYear.name}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label>Class *</Label>
                      <Select value={batchForm.classId} onValueChange={(v) => setBatchForm((f) => ({ ...f, classId: v }))} disabled={!!editingBatchId}>
                        <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                        <SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Batch name *</Label>
                      <Input value={batchForm.name} onChange={(e) => setBatchForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. A" />
                    </div>
                    <div className="space-y-1">
                      <Label>Section</Label>
                      <Input value={batchForm.section} onChange={(e) => setBatchForm((f) => ({ ...f, section: e.target.value }))} placeholder="Optional" />
                    </div>
                    <div className="space-y-1">
                      <Label>Seat limit</Label>
                      <Input type="number" min={1} value={batchForm.seatLimit} onChange={(e) => setBatchForm((f) => ({ ...f, seatLimit: parseInt(e.target.value, 10) || 40 }))} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Class teacher</Label>
                      <Select value={batchForm.classTeacherUserId || "none"} onValueChange={(v) => setBatchForm((f) => ({ ...f, classTeacherUserId: v === "none" ? "" : v }))}>
                        <SelectTrigger><SelectValue placeholder="Select class teacher (optional)" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {teachers.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name} ({t.userId})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setBatchFormOpen(false)}>Cancel</Button>
                    <Button type="submit">{editingBatchId ? "Update" : "Create"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Class teacher</TableHead>
                  <TableHead>Seat limit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchesFiltered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.className}</TableCell>
                    <TableCell>{b.name}</TableCell>
                    <TableCell>{b.section ?? "—"}</TableCell>
                    <TableCell>{b.classTeacherName ?? "—"}</TableCell>
                    <TableCell>{b.seatLimit ?? "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openEditBatch(b)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
