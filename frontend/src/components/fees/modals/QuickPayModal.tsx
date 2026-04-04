import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    studentId: string;
    feeType: string;
    amount: number;
    date: string;
    mode: string;
    reference?: string;
  }) => void;
  studentData: {
    studentId: string;
    studentName: string;
    admissionNumber: string;
    balance: number;
  } | null;
}

export function QuickPayModal({
  isOpen,
  onClose,
  onSave,
  studentData,
}: QuickPayModalProps) {
  const [formData, setFormData] = useState({
    feeType: "All outstanding",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    mode: "Cash",
    reference: "",
  });

  useEffect(() => {
    if (studentData) {
      setFormData({
        feeType: "All outstanding",
        amount: String(studentData.balance),
        date: new Date().toISOString().split('T')[0],
        mode: "Cash",
        reference: "",
      });
    }
  }, [studentData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData) return;
    onSave({
      studentId: studentData.studentId,
      feeType: formData.feeType,
      amount: Number(formData.amount),
      date: formData.date,
      mode: formData.mode,
      reference: formData.reference || undefined,
    });
  };

  if (!studentData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Quick Pay</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Recording payment for {studentData.studentName} (Adm# {studentData.admissionNumber})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Student name</Label>
              <div className="h-9 px-3 flex items-center text-sm bg-slate-100 rounded-md border border-slate-200 text-slate-700">
                {studentData.studentName}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Admission #</Label>
              <div className="h-9 px-3 flex items-center text-sm bg-slate-100 rounded-md border border-slate-200 text-slate-700">
                {studentData.admissionNumber}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Fee type</Label>
            <Select
              value={formData.feeType}
              onValueChange={(v) => setFormData((f) => ({ ...f, feeType: v }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All outstanding" className="text-sm">All outstanding</SelectItem>
                <SelectItem value="Tuition" className="text-sm">Tuition</SelectItem>
                <SelectItem value="Bus" className="text-sm">Bus</SelectItem>
                <SelectItem value="Admission" className="text-sm">Admission</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Amount (AED)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
                className="h-9 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Payment mode</Label>
            <Select
              value={formData.mode}
              onValueChange={(v) => setFormData((f) => ({ ...f, mode: v }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash" className="text-sm">Cash</SelectItem>
                <SelectItem value="Bank transfer" className="text-sm">Bank transfer</SelectItem>
                <SelectItem value="Cheque" className="text-sm">Cheque</SelectItem>
                <SelectItem value="Online" className="text-sm">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Reference (optional)</Label>
            <Input
              type="text"
              placeholder="Transaction ID, cheque number, etc."
              value={formData.reference}
              onChange={(e) => setFormData((f) => ({ ...f, reference: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-sm">
              Cancel
            </Button>
            <Button type="submit" className="h-9 text-sm bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]">
              Save payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}