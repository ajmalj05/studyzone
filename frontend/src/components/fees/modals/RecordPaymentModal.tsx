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
import { StudentDto } from "@/types/fees";
import { fetchApi } from "@/lib/api";

interface RecordPaymentModalProps {
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
  students: StudentDto[];
}

type LedgerMeta = {
  balance: number;
  charges: Array<{ feeType: string; balance: number }>;
};

function mapLedgerCharges(
  charges: Array<{ particularName?: string; balance?: number; amount: number }>
): Array<{ feeType: string; balance: number }> {
  return charges.map((c) => {
    const particularLower = (c.particularName || "").toLowerCase();
    let feeType: "Tuition" | "Bus" | "Admission" | "Manual" = "Manual";
    if (particularLower.includes("tuition")) feeType = "Tuition";
    else if (particularLower.includes("bus")) feeType = "Bus";
    else if (particularLower.includes("admission")) feeType = "Admission";
    return { feeType, balance: c.balance ?? c.amount };
  });
}

function amountForFeeType(feeType: string, meta: LedgerMeta): number {
  if (feeType === "All outstanding") return meta.balance;
  return meta.charges
    .filter((c) => c.feeType.toLowerCase() === feeType.toLowerCase())
    .reduce((s, c) => s + c.balance, 0);
}

const emptyForm = () => ({
  studentId: "",
  feeType: "All outstanding",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  mode: "Cash",
  reference: "",
});

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSave,
  students,
}: RecordPaymentModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [ledgerMeta, setLedgerMeta] = useState<LedgerMeta | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(emptyForm());
    setLedgerMeta(null);
    setLedgerLoading(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !formData.studentId) {
      if (!formData.studentId) setLedgerMeta(null);
      return;
    }

    let cancelled = false;
    setLedgerMeta(null);
    setFormData((f) => ({ ...f, amount: "" }));

    (async () => {
      setLedgerLoading(true);
      try {
        const ledger = await fetchApi(`/Fees/ledger/${formData.studentId}`) as {
          balance?: number;
          charges?: Array<{ particularName?: string; balance?: number; amount: number }>;
        };
        if (cancelled) return;
        const balance = typeof ledger.balance === "number" ? ledger.balance : 0;
        const charges = mapLedgerCharges(ledger.charges ?? []);
        setLedgerMeta({ balance, charges });
      } catch {
        if (!cancelled) setLedgerMeta(null);
      } finally {
        if (!cancelled) setLedgerLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, formData.studentId]);

  useEffect(() => {
    if (!ledgerMeta) return;
    const amt = amountForFeeType(formData.feeType, ledgerMeta);
    setFormData((f) => ({ ...f, amount: String(amt) }));
  }, [ledgerMeta, formData.feeType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      studentId: formData.studentId,
      feeType: formData.feeType,
      amount: Number(formData.amount),
      date: formData.date,
      mode: formData.mode,
      reference: formData.reference || undefined,
    });
    setFormData(emptyForm());
    setLedgerMeta(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Record payment</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select a student to load balances from the ledger. Amount prefills like Quick Pay; you can edit it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Student</Label>
            <Select
              value={formData.studentId}
              onValueChange={(v) => setFormData((f) => ({ ...f, studentId: v }))}
              required
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-sm">
                    {s.name} ({s.admissionNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                placeholder={ledgerLoading ? "Loading…" : "Enter amount"}
                value={formData.amount}
                onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                className="h-9 text-sm"
                disabled={ledgerLoading && !!formData.studentId}
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
