import { useState, useEffect, useRef } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import { BookMarked, Pencil, Plus } from "lucide-react";
import { AcademicsCardIconLead } from "@/components/AcademicsCardIconLead";

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

export default function Batches() {
  const { selectedYearId, currentYear } = useAcademicYear();
  usePageHeaderConfigEffect(
    {
      title: "All Batches",
      description: "Batches are scoped by academic year. Create and edit batches for the current year.",
    },
    [],
  );
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchFormOpen, setBatchFormOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [batchForm, setBatchForm] = useState({
    classId: "",
    academicYearId: "",
    name: "",
    section: "",
    seatLimit: 40,
    classTeacherUserId: "",
  });
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const didInitStatic = useRef(false);

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
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!didInitStatic.current) {
          await loadClasses();
          if (cancelled) return;
          try {
            const list = (await fetchApi("/Users?role=teacher")) as TeacherUserDto[];
            if (!cancelled) setTeachers(Array.isArray(list) ? list : []);
          } catch {
            if (!cancelled) setTeachers([]);
          }
          didInitStatic.current = true;
        }
        await loadBatches();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedYearId]);

  const batchesFiltered = selectedClassId
    ? batches.filter((b) => b.classId === selectedClassId)
    : batches;

  const openAddBatch = () => {
    setEditingBatchId(null);
    setBatchForm({
      classId: classes[0]?.id ?? "",
      academicYearId: selectedYearId ?? "",
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
      academicYearId: b.academicYearId ?? selectedYearId ?? "",
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

  // Table columns
  const batchColumns: DataTableColumn<BatchDto>[] = [
    {
      key: "class",
      header: "Class",
      badge: (b) => ({ label: b.className, variant: "info" }),
    },
    {
      key: "name",
      header: "Batch",
      cell: (b) => <span className="font-semibold text-slate-700 dark:text-slate-200">{b.name}</span>,
    },
    {
      key: "section",
      header: "Section",
      cell: (b) => <span className="text-slate-600 dark:text-slate-400">{b.section ?? "—"}</span>,
    },
    {
      key: "teacher",
      header: "Class Teacher",
      badge: (b) => b.classTeacherName ? { label: b.classTeacherName, variant: "emerald" } : null,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-[80px]",
      cell: (b) => (
        <Button type="button" size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEditBatch(b)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  if (loading) {
    return (<div className="flex min-h-[40vh] items-center justify-center">Loading...</div>);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
          <AcademicsCardIconLead
            icon={BookMarked}
            title="All Batches"
            description="Batches are scoped by academic year. Create and edit batches for the current year."
          />
          <div className="flex w-full min-w-0 flex-wrap items-end gap-2 sm:w-auto sm:justify-end">
            <div className="space-y-2">
              <SearchableSelect
                value={selectedClassId ?? "all"}
                onValueChange={(v) => setSelectedClassId(v === "all" ? null : v)}
                placeholder="Filter by class"
                className="min-w-[10rem] w-full max-w-[220px]"
                options={[{ value: "all", label: "All classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </div>
            <Button type="button" className="shrink-0 gap-2 rounded-lg" onClick={openAddBatch}>
              <Plus className="h-4 w-4" /> Add batch
            </Button>
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
                      <p className="py-1.5 text-sm text-muted-foreground">{currentYear.name}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label>Class *</Label>
                    <SearchableSelect
                      value={batchForm.classId}
                      onValueChange={(v) => setBatchForm((f) => ({ ...f, classId: v }))}
                      placeholder="Class"
                      disabled={!!editingBatchId}
                      options={classes.map((c) => ({ value: c.id, label: c.name }))}
                    />
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
                    <SearchableSelect
                      value={batchForm.classTeacherUserId || "none"}
                      onValueChange={(v) => setBatchForm((f) => ({ ...f, classTeacherUserId: v === "none" ? "" : v }))}
                      placeholder="Select class teacher (optional)"
                      options={[{ value: "none", label: "None" }, ...teachers.map((t) => ({ value: t.id, label: `${t.name} (${t.userId})` }))]}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setBatchFormOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingBatchId ? "Update" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* DataTable Component */}
          <DataTable
            data={batchesFiltered}
            columns={batchColumns}
            keyExtractor={(b) => b.id}
            emptyMessage="No batches found"
            emptyDescription="Create a batch to get started"
          />
        </CardContent>
      </Card>
    </div>
  );
}