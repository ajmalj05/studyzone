import { useState, useEffect } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { BookOpen, Pencil, Plus } from "lucide-react";
import { AcademicsCardIconLead } from "@/components/AcademicsCardIconLead";

interface ClassDto {
  id: string;
  name: string;
  code: string;
}

export default function Classes() {
  usePageHeaderConfigEffect(
    {
      title: "All Classes",
      description: "Create and edit classes. Batches are managed on the Batches tab.",
    },
    [],
  );
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFormOpen, setClassFormOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classForm, setClassForm] = useState({ name: "", code: "" });

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load classes", variant: "destructive" });
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadClasses();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      const name = classForm.name.trim();
      const code = classForm.code.trim();

      if (editingClassId) {
        await fetchApi(`/Classes/${editingClassId}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            code,
          }),
        });
        toast({ title: "Success", description: "Class updated." });
      } else {
        await fetchApi("/Classes", {
          method: "POST",
          body: JSON.stringify({
            name,
            code,
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

  // Define columns for DataTable
  const classColumns: DataTableColumn<ClassDto>[] = [
    {
      key: "name",
      header: "Name",
      cell: (c) => <span className="font-semibold text-slate-700 dark:text-slate-200">{c.name}</span>,
    },
    {
      key: "code",
      header: "Code",
      cell: () => null,
      badge: (c) => ({ label: c.code, variant: "default" }),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-[80px]",
      cell: (c) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => openEditClass(c)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
          <AcademicsCardIconLead
            icon={BookOpen}
            title="All Classes"
            description=""
          />
          <Button type="button" className="shrink-0 gap-2 rounded-lg" onClick={openAddClass}>
            <Plus className="h-4 w-4" /> Add class
          </Button>
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
                    <Input
                      value={classForm.name}
                      onChange={(e) => setClassForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Grade 8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Code *</Label>
                    <Input
                      value={classForm.code}
                      onChange={(e) => setClassForm((f) => ({ ...f, code: e.target.value }))}
                      placeholder="e.g. G8"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setClassFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingClassId ? "Update" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* DataTable Component */}
          <DataTable
            data={classes}
            columns={classColumns}
            keyExtractor={(c) => c.id}
            emptyMessage="No classes yet"
            emptyDescription="Add a class to get started"
          />
        </CardContent>
      </Card>
    </div>
  );
}