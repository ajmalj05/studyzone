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
    if (!form.name.trim()) {
      toast({
        title: "Validation",
        description: "Subject name is required.",
        variant: "destructive",
      });
      return;
    }
    try {
      const payload = { name: form.name.trim(), code: form.code.trim() || undefined };
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
                <Label>Subjects for this class</Label>
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
    </div>
  );
}