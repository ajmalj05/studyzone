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
import { useAcademicYear } from "@/context/AcademicYearContext";
import { CurrentAcademicYearBadge } from "@/components/CurrentAcademicYearBadge";
import { StudentFeeOfferDto, StudentDto, ClassDto, BatchDto } from "@/types/fees";
import { Pencil, Trash2, Percent, Banknote, Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function FeeOffers() {
  const { selectedYearId, currentYear } = useAcademicYear();
  const [offers, setOffers] = useState<StudentFeeOfferDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    academicYearId: "",
    offerType: "PercentageDiscount",
    value: "",
    reason: "",
  });
  const [studentClassFilter, setStudentClassFilter] = useState("");
  const [studentBatchFilter, setStudentBatchFilter] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentComboboxOpen, setStudentComboboxOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<StudentFeeOfferDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadOffers = async () => {
    try {
      const url = selectedYearId
        ? `/Fees/offers?academicYearId=${encodeURIComponent(selectedYearId)}`
        : "/Fees/offers";
      const list = (await fetchApi(url)) as StudentFeeOfferDto[];
      setOffers(list);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load offers", variant: "destructive" });
    }
  };

  const loadStudents = async () => {
    try {
      const params = new URLSearchParams({ take: "500" });
      if (selectedYearId) params.set("academicYearId", selectedYearId);
      const res = (await fetchApi(`/Students?${params.toString()}`)) as { items: StudentDto[] };
      setStudents(res.items ?? []);
    } catch (_) {}
  };

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch (_) {}
  };

  const loadBatches = async () => {
    try {
      const url = selectedYearId ? `/Batches?academicYearId=${encodeURIComponent(selectedYearId)}` : "/Batches";
      const list = (await fetchApi(url)) as BatchDto[];
      setBatches(list);
    } catch (_) {
      setBatches([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadOffers(), loadStudents(), loadClasses(), loadBatches()]);
      setLoading(false);
    })();
  }, [selectedYearId]);

  const openAdd = () => {
    setEditingOffer(null);
    setForm({
      studentId: "",
      academicYearId: selectedYearId ?? "",
      offerType: "PercentageDiscount",
      value: "",
      reason: "",
    });
    setStudentClassFilter("");
    setStudentBatchFilter("");
    setStudentSearch("");
    setStudentComboboxOpen(false);
    setModalOpen(true);
  };

  const openEdit = (o: StudentFeeOfferDto) => {
    setEditingOffer(o);
    setForm({
      studentId: o.studentId,
      academicYearId: o.academicYearId,
      offerType: o.offerType || "PercentageDiscount",
      value: String(o.value),
      reason: o.reason ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const academicYearId = form.academicYearId || selectedYearId;
    if (!academicYearId) {
      toast({ title: "Validation", description: "Select an academic year.", variant: "destructive" });
      return;
    }
    if (!form.studentId) {
      toast({ title: "Validation", description: "Select a student.", variant: "destructive" });
      return;
    }
    const valueNum = Number(form.value);
    if (form.value === "" || isNaN(valueNum) || valueNum < 0) {
      toast({ title: "Validation", description: "Enter a valid value.", variant: "destructive" });
      return;
    }
    if (form.offerType === "PercentageDiscount" && (valueNum > 100 || valueNum <= 0)) {
      toast({ title: "Validation", description: "Percentage must be between 1 and 100.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await fetchApi("/Fees/offers", {
        method: "POST",
        body: JSON.stringify({
          studentId: form.studentId,
          academicYearId,
          offerType: form.offerType,
          value: valueNum,
          reason: form.reason.trim() || undefined,
        }),
      });
      toast({ title: "Success", description: editingOffer ? "Offer updated." : "Offer added." });
      setModalOpen(false);
      await loadOffers();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetchApi(`/Fees/offers/${deleteId}`, { method: "DELETE" });
      toast({ title: "Success", description: "Offer removed." });
      setDeleteId(null);
      await loadOffers();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    } finally {
      setDeleting(false);
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
        <DashboardHeader title="Fee offers" description="Concessions and discounts by student" />
        <CurrentAcademicYearBadge />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Fee offers (concessions)</CardTitle>
          <CardDescription>
            Apply percentage or fixed discount per charge for selected students. Offers apply to charges generated after the offer is set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={openAdd}>Add offer</Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground text-sm">
                    No fee offers for the selected academic year.
                  </TableCell>
                </TableRow>
              ) : (
                offers.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.studentName}</TableCell>
                    <TableCell>{o.className ?? "—"}</TableCell>
                    <TableCell>
                      {o.offerType === "PercentageDiscount" ? (
                        <span className="inline-flex items-center gap-1"><Percent className="h-3.5 w-3.5" /> Percentage</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Banknote className="h-3.5 w-3.5" /> Fixed</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {o.offerType === "PercentageDiscount" ? `${o.value}%` : `₹${o.value.toLocaleString("en-IN")}`}
                    </TableCell>
                    <TableCell>{o.reason ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(o)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteId(o.id)} aria-label="Remove">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingOffer ? "Edit offer" : "Add fee offer"}</DialogTitle>
                <DialogDescription>
                  Set a concession for a student for the selected academic year. Percentage discount reduces each charge; fixed discount subtracts the amount from each charge.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                {currentYear && (
                  <div className="space-y-1">
                    <Label>Academic year</Label>
                    <p className="text-sm text-muted-foreground py-1.5">{currentYear.name}</p>
                  </div>
                )}
                {!editingOffer && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Filter by class</Label>
                        <Select
                          value={studentClassFilter || "__all__"}
                          onValueChange={(v) => {
                            const value = v === "__all__" ? "" : v;
                            setStudentClassFilter(value);
                            setStudentBatchFilter("");
                            const stillInList = !form.studentId || students.some((s) => s.id === form.studentId && (!value || s.classId === value));
                            if (!stillInList) setForm((f) => ({ ...f, studentId: "" }));
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All classes</SelectItem>
                            {classes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Filter by batch</Label>
                        <Select
                          value={studentBatchFilter || "__all__"}
                          onValueChange={(v) => {
                            const value = v === "__all__" ? "" : v;
                            setStudentBatchFilter(value);
                            const stillInList = !form.studentId || students.some((s) => s.id === form.studentId && (!value || s.batchId === value));
                            if (!stillInList) setForm((f) => ({ ...f, studentId: "" }));
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="All batches" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All batches</SelectItem>
                            {(studentClassFilter ? batches.filter((b) => b.classId === studentClassFilter) : batches).map((b) => (
                              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <Label>Student</Label>
                  {editingOffer ? (
                    <p className="text-sm py-2">{editingOffer.studentName}</p>
                  ) : (
                    <Popover open={studentComboboxOpen} onOpenChange={setStudentComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={studentComboboxOpen}
                          className={cn("w-full justify-between font-normal", !form.studentId && "text-muted-foreground")}
                        >
                          {form.studentId
                            ? (() => {
                                const s = students.find((x) => x.id === form.studentId);
                                return s ? `${s.name} (${s.admissionNumber})${s.className ? ` – ${s.className} / ${s.batchName ?? ""}` : ""}` : "Select student";
                              })()
                            : "Select student"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search by name or admission number..."
                            value={studentSearch}
                            onValueChange={setStudentSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No student found.</CommandEmpty>
                            <CommandGroup>
                              {(() => {
                                const byClass = studentClassFilter ? students.filter((s) => s.classId === studentClassFilter) : students;
                                const byBatch = studentBatchFilter ? byClass.filter((s) => s.batchId === studentBatchFilter) : byClass;
                                const term = studentSearch.trim().toLowerCase();
                                const filtered = term
                                  ? byBatch.filter((s) => (s.name?.toLowerCase().includes(term) || (s.admissionNumber ?? "").toLowerCase().includes(term)))
                                  : byBatch;
                                return filtered.map((s) => (
                                  <CommandItem
                                    key={s.id}
                                    value={s.id}
                                    onSelect={() => {
                                      setForm((f) => ({ ...f, studentId: s.id }));
                                      setStudentComboboxOpen(false);
                                      setStudentSearch("");
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", form.studentId === s.id ? "opacity-100" : "opacity-0")} />
                                    {s.name} ({s.admissionNumber}){s.className ? ` – ${s.className} / ${s.batchName ?? ""}` : ""}
                                  </CommandItem>
                                ));
                              })()}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Offer type</Label>
                  <Select
                    value={form.offerType}
                    onValueChange={(v) => setForm((f) => ({ ...f, offerType: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PercentageDiscount">Percentage discount</SelectItem>
                      <SelectItem value="FixedDiscount">Fixed discount per charge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{form.offerType === "PercentageDiscount" ? "Percentage (e.g. 20 for 20% off)" : "Amount (₹) off per charge"}</Label>
                  <Input
                    type="number"
                    min={form.offerType === "PercentageDiscount" ? 1 : 0}
                    max={form.offerType === "PercentageDiscount" ? 100 : undefined}
                    step={form.offerType === "PercentageDiscount" ? 1 : 0.01}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder={form.offerType === "PercentageDiscount" ? "20" : "500"}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Reason (optional)</Label>
                  <Input
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    placeholder="e.g. Sibling discount, Merit"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this offer?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will not change charges already generated. Only future charge generation will use the full amount.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? "Removing…" : "Remove"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
