import { useState, useEffect, useMemo } from "react";
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
import { Check, ChevronsUpDown } from "lucide-react";
import {
  StudentDto,
  ClassDto,
  BatchDto,
  feeTypeFromParticularName,
  orderedFeeTypeKeysForOutstandingCharges,
} from "@/types/fees";
import { fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const ALL = "__all__";

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
  classes: ClassDto[];
  batches: BatchDto[];
  students: StudentDto[];
}

type LedgerMeta = {
  balance: number;
  charges: Array<{ feeType: string; balance: number }>;
};

function mapLedgerCharges(
  charges: Array<{ particularName?: string; balance?: number; amount: number }>
): Array<{ feeType: string; balance: number }> {
  return charges.map((c) => ({
    feeType: feeTypeFromParticularName(c.particularName),
    balance: c.balance ?? c.amount,
  }));
}

function sumChargeBalances(meta: LedgerMeta): number {
  return meta.charges.reduce((s, c) => s + c.balance, 0);
}

function amountForFeeType(feeType: string, meta: LedgerMeta): number {
  if (feeType === "All outstanding") return sumChargeBalances(meta);
  const ft = feeType.toLowerCase();
  return meta.charges
    .filter((c) => c.feeType.toLowerCase() === ft)
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
  classes,
  batches,
  students,
}: RecordPaymentModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [ledgerMeta, setLedgerMeta] = useState<LedgerMeta | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [classFilter, setClassFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [studentComboboxOpen, setStudentComboboxOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const batchesForClass = useMemo(
    () => (classFilter ? batches.filter((b) => b.classId === classFilter) : batches),
    [batches, classFilter]
  );

  const studentsByClassBatch = useMemo(() => {
    let list = students;
    if (classFilter) list = list.filter((s) => s.classId === classFilter);
    if (batchFilter) list = list.filter((s) => s.batchId === batchFilter);
    return list;
  }, [students, classFilter, batchFilter]);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(emptyForm());
    setLedgerMeta(null);
    setLedgerLoading(false);
    setClassFilter("");
    setBatchFilter("");
    setStudentSearch("");
    setStudentComboboxOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !formData.studentId) {
      if (!formData.studentId) setLedgerMeta(null);
      return;
    }

    let cancelled = false;
    setLedgerMeta(null);
    setFormData((f) => ({ ...f, feeType: "All outstanding", amount: "" }));

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

  /** Prefill when ledger loads only (same idea as QuickPay: avoid effect + Select fighting over amount). */
  useEffect(() => {
    if (!ledgerMeta) return;
    setFormData((f) => {
      const keys = orderedFeeTypeKeysForOutstandingCharges(ledgerMeta.charges);
      const feeType = keys.length === 1 ? keys[0]! : "All outstanding";
      const amt = amountForFeeType(feeType, ledgerMeta);
      return { ...f, feeType, amount: String(amt) };
    });
  }, [ledgerMeta]);

  const handleFeeTypeChange = (value: string) => {
    if (!ledgerMeta) return;
    setFormData((f) => ({
      ...f,
      feeType: value,
      amount: String(amountForFeeType(value, ledgerMeta)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId.trim()) {
      toast({
        title: "Select a student",
        description: "Choose a student before saving the payment.",
        variant: "destructive",
      });
      return;
    }
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
    setClassFilter("");
    setBatchFilter("");
    setStudentSearch("");
  };

  const studentLabel = (s: StudentDto) =>
    `${s.name} (${s.admissionNumber})${s.className ? ` – ${s.className} / ${s.batchName ?? ""}` : ""}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-[520px]",
          "flex max-h-[calc(100vh-4rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100vh-4rem)]"
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 pt-6 pb-2">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-base font-medium">Record payment</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select a student; amount prefills from the ledger and you can edit it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Class</Label>
              <Select
                value={classFilter || ALL}
                onValueChange={(v) => {
                  const value = v === ALL ? "" : v;
                  setClassFilter(value);
                  setBatchFilter("");
                  const stillInList =
                    !formData.studentId ||
                    students.some(
                      (s) =>
                        s.id === formData.studentId &&
                        (!value || s.classId === value)
                    );
                  if (!stillInList) setFormData((f) => ({ ...f, studentId: "" }));
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="text-sm">
                    All classes
                  </SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-sm">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Batch</Label>
              <Select
                value={batchFilter || ALL}
                onValueChange={(v) => {
                  const value = v === ALL ? "" : v;
                  setBatchFilter(value);
                  const stillInList =
                    !formData.studentId ||
                    students.some(
                      (s) =>
                        s.id === formData.studentId &&
                        (!classFilter || s.classId === classFilter) &&
                        (!value || s.batchId === value)
                    );
                  if (!stillInList) setFormData((f) => ({ ...f, studentId: "" }));
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="text-sm">
                    All batches
                  </SelectItem>
                  {batchesForClass.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-sm">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Student</Label>
            <Popover open={studentComboboxOpen} onOpenChange={setStudentComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={studentComboboxOpen}
                  className={cn(
                    "h-9 w-full justify-between font-normal text-sm px-3",
                    !formData.studentId && "text-muted-foreground"
                  )}
                >
                  {formData.studentId
                    ? (() => {
                        const s = students.find((x) => x.id === formData.studentId);
                        return s ? studentLabel(s) : "Select student";
                      })()
                    : "Select student"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by name or admission number…"
                    value={studentSearch}
                    onValueChange={setStudentSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup>
                      {(() => {
                        const term = studentSearch.trim().toLowerCase();
                        const filtered = term
                          ? studentsByClassBatch.filter((s) => {
                              const nm = (s.name ?? "").toLowerCase();
                              const adm = (s.admissionNumber ?? "").toLowerCase();
                              return nm.includes(term) || adm.includes(term);
                            })
                          : studentsByClassBatch;
                        return filtered.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={s.id}
                            onSelect={() => {
                              setFormData((f) => ({ ...f, studentId: s.id }));
                              setStudentComboboxOpen(false);
                              setStudentSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.studentId === s.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {studentLabel(s)}
                          </CommandItem>
                        ));
                      })()}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Fee type</Label>
            <Select
              value={formData.feeType}
              onValueChange={handleFeeTypeChange}
              disabled={!ledgerMeta || ledgerLoading}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All outstanding" className="text-sm">
                  {ledgerMeta
                    ? `All outstanding (AED ${sumChargeBalances(ledgerMeta).toFixed(2)})`
                    : "All outstanding"}
                </SelectItem>
                {ledgerMeta &&
                  orderedFeeTypeKeysForOutstandingCharges(ledgerMeta.charges).map((key) => {
                    const lineAmt = amountForFeeType(key, ledgerMeta);
                    if (lineAmt < 0.01) return null;
                    return (
                      <SelectItem key={key} value={key} className="text-sm">
                        {key} (AED {lineAmt.toFixed(2)})
                      </SelectItem>
                    );
                  })}
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

          <DialogFooter className="pt-4 border-t gap-2 pb-1">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-sm">
              Cancel
            </Button>
            <Button type="submit" className="h-9 text-sm bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]">
              Save payment
            </Button>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
