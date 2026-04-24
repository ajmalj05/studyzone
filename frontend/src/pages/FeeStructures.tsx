import { useState, useEffect, useMemo } from "react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import { FeeStructureDto, ClassDto, formatCurrency } from "@/types/fees";
import { Pencil, Trash2 } from "lucide-react";
import { FeeTablePaginationBar } from "@/components/fees/FeeTablePaginationBar";
import { feeSlicePage, feeClampPage, FEE_UI_PAGE_SIZE } from "@/lib/feeListPagination";
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

export default function FeeStructures() {
  const { selectedYearId, currentYear } = useAcademicYear();
  const [structures, setStructures] = useState<FeeStructureDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [structureForm, setStructureForm] = useState({ classId: "", academicYearId: "", name: "", amount: "", frequency: "Monthly" });
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", amount: "", frequency: "Monthly" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [structuresPage, setStructuresPage] = useState(1);

  const loadStructures = async () => {
    try {
      const url = selectedYearId
        ? `/Fees/structures?academicYearId=${encodeURIComponent(selectedYearId)}`
        : "/Fees/structures";
      const list = (await fetchApi(url)) as FeeStructureDto[];
      setStructures(list);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load fee structures", variant: "destructive" });
    }
  };

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch (_) {}
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadStructures(), loadClasses()]);
      setLoading(false);
    })();
  }, [selectedYearId]);

  useEffect(() => {
    setStructuresPage(1);
  }, [selectedYearId]);

  useEffect(() => {
    setStructuresPage((p) => feeClampPage(p, structures.length, FEE_UI_PAGE_SIZE));
  }, [structures.length]);

  const pagedStructures = useMemo(
    () => feeSlicePage(structures, structuresPage, FEE_UI_PAGE_SIZE),
    [structures, structuresPage]
  );

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureForm.classId || !structureForm.name.trim() || !structureForm.amount || Number(structureForm.amount) <= 0) {
      toast({ title: "Validation", description: "Class, name and amount required.", variant: "destructive" });
      return;
    }
    const academicYearId = structureForm.academicYearId || selectedYearId;
    if (!academicYearId) {
      toast({ title: "Validation", description: "Select an academic year.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/Fees/structures", {
        method: "POST",
        body: JSON.stringify({
          classId: structureForm.classId,
          academicYearId,
          name: structureForm.name,
          amount: Number(structureForm.amount),
          frequency: structureForm.frequency,
        }),
      });
      toast({ title: "Success", description: "Fee structure created." });
      setStructureForm({ classId: "", academicYearId: "", name: "", amount: "", frequency: "Monthly" });
      setStructureModalOpen(false);
      await loadStructures();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleUpdateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm.name.trim() || !editForm.amount || Number(editForm.amount) <= 0) {
      toast({ title: "Validation", description: "Name and amount required.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi(`/Fees/structures/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editForm.name.trim(),
          amount: Number(editForm.amount),
          frequency: editForm.frequency,
        }),
      });
      toast({ title: "Success", description: "Fee structure updated." });
      setEditingId(null);
      setEditForm({ name: "", amount: "", frequency: "Monthly" });
      await loadStructures();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleDeleteStructure = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetchApi(`/Fees/structures/${deleteId}`, { method: "DELETE" });
      toast({ title: "Success", description: "Fee structure deleted." });
      setDeleteId(null);
      await loadStructures();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (s: FeeStructureDto) => {
    setEditingId(s.id);
    setEditForm({ name: s.name, amount: String(s.amount), frequency: s.frequency || "Monthly" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Fee structures</CardTitle>
          <CardDescription>Define fee by class and academic year (e.g. Tuition, Lab).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => { setStructureForm((f) => ({ ...f, academicYearId: selectedYearId })); setStructureModalOpen(true); }}>Add fee structure</Button>
          <Dialog open={structureModalOpen} onOpenChange={(open) => { if (open) setStructureForm((f) => ({ ...f, academicYearId: selectedYearId })); setStructureModalOpen(open); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add fee structure</DialogTitle>
                <DialogDescription>Define fee by class and academic year.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateStructure} className="space-y-3">
                {currentYear && (
                  <div className="space-y-1">
                    <Label>Academic year</Label>
                    <p className="text-sm text-muted-foreground py-1.5">{currentYear.name}</p>
                  </div>
                )}
                <div className="space-y-1"><Label>Class</Label><SearchableSelect value={structureForm.classId} onValueChange={(v) => setStructureForm((f) => ({ ...f, classId: v }))} placeholder="Class" options={classes.map((c) => ({ value: c.id, label: c.name }))} /></div>
                <div className="space-y-1"><Label>Name</Label><Input value={structureForm.name} onChange={(e) => setStructureForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Tuition" /></div>
                <div className="space-y-1"><Label>Amount (AED)</Label><Input type="number" min="0" step="0.01" value={structureForm.amount} onChange={(e) => setStructureForm((f) => ({ ...f, amount: e.target.value }))} /></div>
                <div className="space-y-1">
                  <Label>Frequency</Label>
                  <SearchableSelect
                    value={structureForm.frequency}
                    onValueChange={(v) => setStructureForm((f) => ({ ...f, frequency: v }))}
                    options={[
                      { value: "Monthly", label: "Monthly" },
                      { value: "Quarterly", label: "Quarterly" },
                      { value: "HalfYearly", label: "Half-yearly" },
                      { value: "Yearly", label: "Yearly" },
                      { value: "Once", label: "One-time (e.g. Admission fee)" },
                    ]}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setStructureModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Add</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">
                      No fee structures for the selected academic year. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedStructures.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.className}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{formatCurrency(s.amount)}</TableCell>
                      <TableCell>{s.frequency}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(s)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteId(s.id)} aria-label="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <FeeTablePaginationBar
              page={structuresPage}
              total={structures.length}
              onPageChange={setStructuresPage}
            />
          </div>

          <Dialog open={!!editingId} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit fee structure</DialogTitle>
                <DialogDescription>Update name, amount or frequency.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateStructure} className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Tuition" />
                </div>
                <div className="space-y-1">
                  <Label>Amount (AED)</Label>
                  <Input type="number" min="0" step="0.01" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Frequency</Label>
                  <SearchableSelect
                    value={editForm.frequency}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, frequency: v }))}
                    options={[
                      { value: "Monthly", label: "Monthly" },
                      { value: "Quarterly", label: "Quarterly" },
                      { value: "HalfYearly", label: "Half-yearly" },
                      { value: "Yearly", label: "Yearly" },
                      { value: "Once", label: "One-time (e.g. Admission fee)" },
                    ]}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete fee structure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone. If any charges use this structure, deletion will be blocked.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteStructure} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
