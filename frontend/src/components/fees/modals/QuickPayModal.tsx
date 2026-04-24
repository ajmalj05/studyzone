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
import { SearchableSelect } from "@/components/ui/searchable-select";

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
  charges?: Array<{
    id: string;
    feeType: string;
    amount: number;
    paid: number;
    balance: number;
  }>;
}

export function QuickPayModal({
  isOpen,
  onClose,
  onSave,
  studentData,
  charges = [],
}: QuickPayModalProps) {
  const [formData, setFormData] = useState({
    feeType: "All outstanding",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    mode: "Cash",
    reference: "",
  });

  // Calculate which fee types have outstanding balance
  const getFeeTypesWithBalance = () => {
    const feeTypeTotals: Record<string, number> = {};
    
    charges.forEach(c => {
      const type = c.feeType;
      if (!feeTypeTotals[type]) feeTypeTotals[type] = 0;
      feeTypeTotals[type] += c.balance;
    });
    
    // Match SelectItem epsilon: hide fully paid categories (tiny float dust)
    return Object.entries(feeTypeTotals)
      .filter(([, balance]) => balance > 0.01)
      .map(([type]) => type);
  };

  // Calculate amount based on selected fee type
  const getAmountForFeeType = (feeType: string): number => {
    if (feeType === "All outstanding") {
      return studentData?.balance || 0;
    }
    
    // Sum up the balance for the selected fee type
    const feeTypeCharges = charges.filter(c => 
      c.feeType.toLowerCase() === feeType.toLowerCase()
    );
    return feeTypeCharges.reduce((sum, c) => sum + c.balance, 0);
  };

  useEffect(() => {
    if (studentData) {
      // Check which fee types have outstanding balance
      const availableFeeTypes = getFeeTypesWithBalance();
      
      // If there's only one fee type with balance, default to it
      // Otherwise default to "All outstanding"
      const defaultFeeType = availableFeeTypes.length === 1 
        ? availableFeeTypes[0] 
        : "All outstanding";
      
      setFormData({
        feeType: defaultFeeType,
        amount: String(getAmountForFeeType(defaultFeeType)),
        date: new Date().toISOString().split('T')[0],
        mode: "Cash",
        reference: "",
      });
    }
  }, [studentData, charges, isOpen]);

  // Update amount when fee type changes
  const handleFeeTypeChange = (value: string) => {
    const newAmount = getAmountForFeeType(value);
    setFormData((f) => ({ 
      ...f, 
      feeType: value,
      amount: String(newAmount)
    }));
  };

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
            {studentData.studentName} (Adm# {studentData.admissionNumber}) — amount prefills from the ledger; you can edit it.
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
            <SearchableSelect
              value={formData.feeType}
              onValueChange={handleFeeTypeChange}
              options={[
                { value: "All outstanding", label: `All outstanding (AED ${(studentData?.balance || 0).toFixed(2)})` },
                ...getFeeTypesWithBalance()
                  .filter(feeType => getAmountForFeeType(feeType) >= 0.01)
                  .map(feeType => ({
                    value: feeType,
                    label: `${feeType} (AED ${getAmountForFeeType(feeType).toFixed(2)})`,
                  })),
              ]}
            />
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
            <SearchableSelect
              value={formData.mode}
              onValueChange={(v) => setFormData((f) => ({ ...f, mode: v }))}
              options={[
                { value: "Cash", label: "Cash" },
                { value: "Bank transfer", label: "Bank transfer" },
                { value: "Cheque", label: "Cheque" },
                { value: "Online", label: "Online" },
              ]}
            />
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