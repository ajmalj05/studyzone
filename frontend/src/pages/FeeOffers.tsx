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
import { StudentFeeOfferDto, StudentDto } from "@/types/fees";
import { Pencil, Trash2, Percent, Banknote } from "lucide-react";

export default function FeeOffers() {
  const { selectedYearId, currentYear } = useAcademicYear();
  const [offers, setOffers] = useState<StudentFeeOfferDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    academicYearId: "",
    offerType: "PercentageDiscount",
    value: "",
    reason: "",
  });
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
      const res = (await fetchApi("/Students?take=500")) as { items: StudentDto[] };
      setStudents(res.items ?? []);
    } catch (_) {}
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadOffers(), loadStudents()]);
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
                <div className="space-y-1">
                  <Label>Student</Label>
                  <Select
                    value={form.studentId}
                    onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
                    required
                    disabled={!!editingOffer}
                  >
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.admissionNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
