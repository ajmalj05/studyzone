import { useState, useEffect } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { BookOpen, Pencil, Trash2, Plus, Link2 } from "lucide-react";
import { AcademicsCardIconLead } from "@/components/AcademicsCardIconLead";

interface SubjectDto {
  id: string;
  name: string;
  code?: string;
  createdAt: string;
}

interface ClassDto {
  id: string;
  name: string;
  code: string;
}

export default function Subjects() {
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [classSubjectIds, setClassSubjectIds] = useState<Set<string>>(new Set());
  const [mappingLoading, setMappingLoading] = useState(false);
  const [savingMapping, setSavingMapping] = useState(false);
  const [bulkMapOpen, setBulkMapOpen] = useState(false);
  const [bulkClassIds, setBulkClassIds] = useState<string[]>([]);

  usePageHeaderConfigEffect(
    { title: "Subjects", description: "Add subjects and map them to classes." },
    [],
  );

  const loadSubjects = async () => {
    try {
      const list = (await fetchApi("/Subjects")) as SubjectDto[];
      setSubjects(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to load subjects",
        variant: "destructive",
      });
    }
  };

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(Array.isArray(list) ? list : []);
    } catch {
      setClasses([]);
    }
  };

  const loadMapping = async (classId: string) => {
    if (!classId) {
      setClassSubjectIds(new Set());
      return;
    }
    setMappingLoading(true);
    try {
      const list = (await fetchApi(`/Subjects/for-class/${classId}`)) as SubjectDto[];
      setClassSubjectIds(new Set((Array.isArray(list) ? list : []).map((s) => s.id)));
    } catch {
      setClassSubjectIds(new Set());
    } finally {
      setMappingLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadSubjects(), loadClasses()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    loadMapping(selectedClassId);
  }, [selectedClassId]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", code: "" });
    setFormOpen(true);
  };

  const openEdit = (s: SubjectDto) => {
    setEditingId(s.id);
    setForm({ name: s.name, code: s.code ?? "" });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = form.name.trim();
    if (!normalizedName) {
      toast({
        title: "Validation",
        description: "Subject name is required.",
        variant: "destructive",
      });
      return;
    }
    const duplicate = subjects.find(
      (s) =>
        s.id !== editingId &&
        s.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );
    if (duplicate) {
      toast({
        title: "Duplicate subject",
        description: `Subject '${normalizedName}' already exists.`,
        variant: "destructive",
      });
      return;
    }
    try {
      const payload = { name: normalizedName, code: form.code.trim() || undefined };
      if (editingId) {
        await fetchApi(`/Subjects/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast({ title: "Success", description: "Subject updated." });
      } else {
        await fetchApi("/Subjects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({ title: "Success", description: "Subject created." });
      }
      setFormOpen(false);
      await loadSubjects();
      if (selectedClassId) await loadMapping(selectedClassId);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message || "Failed",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetchApi(`/Subjects/${deleteId}`, { method: "DELETE" });
      toast({ title: "Success", description: "Subject deleted." });
      setDeleteId(null);
      await loadSubjects();
      if (selectedClassId) await loadMapping(selectedClassId);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const toggleClassSubject = (subjectId: string) => {
    setClassSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  };

  const saveMapping = async () => {
    if (!selectedClassId) {
      toast({
        title: "Validation",
        description: "Select a class first.",
        variant: "destructive",
      });
      return;
    }
    setSavingMapping(true);
    try {
      await fetchApi(`/Subjects/for-class/${selectedClassId}`, {
        method: "PUT",
        body: JSON.stringify({ subjectIds: Array.from(classSubjectIds) }),
      });
      toast({ title: "Success", description: "Subjects mapped to class." });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message || "Failed to save mapping",
        variant: "destructive",
      });
    } finally {
      setSavingMapping(false);
    }
  };

  const toggleSelectAllSubjects = () => {
    setClassSubjectIds((prev) => {
      if (subjects.length === 0) return prev;
      if (prev.size === subjects.length) {
        return new Set<string>();
      }
      return new Set(subjects.map((s) => s.id));
    });
  };

  const toggleBulkClass = (classId: string) => {
    setBulkClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId],
    );
  };

  const runBulkMapping = async () => {
    if (bulkClassIds.length === 0) {
      toast({
        title: "Validation",
        description: "Select at least one class.",
        variant: "destructive",
      });
      return;
    }
    setSavingMapping(true);
    try {
      let updatedCount = 0;
      let alreadyMappedCount = 0;
      for (const classId of bulkClassIds) {
        const existing = (await fetchApi(`/Subjects/for-class/${classId}`)) as SubjectDto[];
        const existingIds = new Set((Array.isArray(existing) ? existing : []).map((s) => s.id));
        const selectedIds = new Set(Array.from(classSubjectIds));
        const sameSize = existingIds.size === selectedIds.size;
        const sameValues = sameSize && Array.from(existingIds).every((id) => selectedIds.has(id));
        if (sameValues) {
          alreadyMappedCount += 1;
          continue;
        }
        await fetchApi(`/Subjects/for-class/${classId}`, {
          method: "PUT",
          body: JSON.stringify({ subjectIds: Array.from(classSubjectIds) }),
        });
        updatedCount += 1;
      }

      if (updatedCount > 0) {
        toast({
          title: "Success",
          description: `Mapping saved for ${updatedCount} class${updatedCount > 1 ? "es" : ""}.`,
        });
      }
      if (alreadyMappedCount > 0) {
        toast({
          title: "You already mapped",
          description: `${alreadyMappedCount} class${alreadyMappedCount > 1 ? "es are" : " is"} already mapped with the same subjects.`,
          variant: "destructive",
        });
      }
      setBulkMapOpen(false);
      setBulkClassIds([]);
      if (selectedClassId) await loadMapping(selectedClassId);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message || "Failed to map subjects",
        variant: "destructive",
      });
    } finally {
      setSavingMapping(false);
    }
  };

  // Table columns
  const subjectColumns: DataTableColumn<SubjectDto>[] = [
    {
      key: "name",
      header: "Name",
      cell: (s) => <span className="font-semibold text-slate-700 dark:text-slate-200">{s.name}</span>,
    },
    {
      key: "code",
      header: "Code",
      badge: (s) => s.code ? { label: s.code, variant: "default" } : null,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-[100px]",
      cell: (s) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEdit(s)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => setDeleteId(s.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Total Subjects</p><p className="mt-1 text-2xl font-extrabold text-teal-700">{subjects.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Classes</p><p className="mt-1 text-2xl font-extrabold text-blue-600">{classes.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Mapped</p><p className="mt-1 text-2xl font-extrabold text-emerald-600">{classSubjectIds.size}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Selected Class</p><p className="mt-1 text-base font-extrabold text-amber-600">{classes.find((c) => c.id === selectedClassId)?.name ?? "None"}</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <Card className="min-w-0">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
            <AcademicsCardIconLead
              icon={BookOpen}
              title="All Subjects"
              description="Create and edit subjects. Map them to classes."
            />
            <Button type="button" onClick={openAdd} className="shrink-0 gap-2 rounded-lg">
              <Plus className="h-4 w-4" /> Add Subject
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataTable
              data={subjects}
              columns={subjectColumns}
              keyExtractor={(s) => s.id}
              emptyMessage="No subjects yet"
              emptyDescription="Add a subject to get started"
            />
          </CardContent>
        </Card>

        <Card className="min-w-0 self-start lg:sticky lg:top-4 lg:z-[1]">
          <CardHeader>
            <AcademicsCardIconLead
              icon={Link2}
              title="Map Subjects to Class"
              description="Select a class and choose which subjects apply to it."
            />
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="w-full min-w-0 space-y-2 pt-3">
              <Label htmlFor="map-subjects-class" className="text-sm font-medium">
                Class
              </Label>
              <SearchableSelect
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                placeholder="Select class"
                options={classes.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
              />
            </div>
            {selectedClassId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Subjects for this class</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAllSubjects}
                    >
                      {classSubjectIds.size === subjects.length && subjects.length > 0
                        ? "Clear all subjects"
                        : "Select all subjects"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkMapOpen(true)}
                    >
                      Map multiple classes
                    </Button>
                  </div>
                </div>
                {mappingLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add subjects in the list first.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {subjects.map((s) => (
                      <label
                        key={s.id}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-input bg-background px-3 py-2 shadow-sm transition-colors hover:border-muted-foreground/30 hover:bg-muted/25 has-[:checked]:border-[hsl(194,70%,27%)]/45 has-[:checked]:bg-muted/35"
                      >
                        <input
                          type="checkbox"
                          checked={classSubjectIds.has(s.id)}
                          onChange={() => toggleClassSubject(s.id)}
                          className="size-4 shrink-0 rounded border-input accent-[hsl(194,70%,27%)]"
                        />
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block text-sm font-medium">{s.name}</span>
                          {s.code ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">{s.code}</span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  onClick={saveMapping}
                  disabled={mappingLoading || savingMapping}
                  className="mt-2 w-full gap-2 rounded-lg"
                >
                  {savingMapping ? "Saving..." : "Save mapping"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Subject" : "Add Subject"}
            </DialogTitle>
            <DialogDescription>
              Enter the subject name and optional code.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subj-name">Name</Label>
              <Input
                id="subj-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Mathematics"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subj-code">Code (optional)</Label>
              <Input
                id="subj-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. MATH"
                className="rounded-lg"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg">
                {editingId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subject?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the subject from the list and from any class
              mappings. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={bulkMapOpen} onOpenChange={setBulkMapOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Map subjects to multiple classes</DialogTitle>
            <DialogDescription>
              Select classes and apply the current selected subject set in one click.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
              {classes.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={bulkClassIds.includes(c.id)}
                    onChange={() => toggleBulkClass(c.id)}
                    className="size-4 rounded border-input accent-[hsl(194,70%,27%)]"
                  />
                  <span className="text-sm">{c.name} ({c.code})</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Subjects selected: {classSubjectIds.size}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBulkMapOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={runBulkMapping} disabled={savingMapping}>
              {savingMapping ? "Mapping..." : "Apply mapping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}