import { useState, useEffect } from "react";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardHeader
        title="Subjects"
        description="Add subjects and map them to classes"
      />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> All Subjects
            </CardTitle>
            <CardDescription>
              Create and edit subjects. Then map them to classes below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={openAdd} className="rounded-xl gap-2">
              <Plus className="h-4 w-4" /> Add Subject
            </Button>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-center py-8">
                      No subjects yet. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.code ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(s.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" /> Map Subjects to Class
            </CardTitle>
            <CardDescription>
              Select a class and choose which subjects apply to it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={selectedClassId}
                  onValueChange={setSelectedClassId}
                >
                  <SelectTrigger className="w-[220px] rounded-xl">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedClassId && (
                <Button
                  onClick={saveMapping}
                  disabled={mappingLoading || savingMapping}
                  className="rounded-xl gap-2"
                >
                  {savingMapping ? "Saving..." : "Save mapping"}
                </Button>
              )}
            </div>
            {selectedClassId && (
              <div className="space-y-2">
                <Label>Subjects for this class</Label>
                {mappingLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add subjects above first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-4 border rounded-xl p-4 bg-muted/30">
                    {subjects.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={classSubjectIds.has(s.id)}
                          onChange={() => toggleClassSubject(s.id)}
                          className="rounded border-input"
                        />
                        <span className="text-sm">
                          {s.name}
                          {s.code ? ` (${s.code})` : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
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
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subj-code">Code (optional)</Label>
              <Input
                id="subj-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. MATH"
                className="rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl">
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
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
