import { useState } from "react";
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
import { DatePicker } from "@/components/ui/date-picker";

interface ManualChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    description: string;
    amount: number;
    date: string;
  }) => void;
}

export function ManualChargeModal({
  isOpen,
  onClose,
  onSave,
}: ManualChargeModalProps) {
  const getInitialFormData = () => ({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [formData, setFormData] = useState({
    ...getInitialFormData(),
  });

  const resetForm = () => {
    setFormData(getInitialFormData());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
    });
    resetForm();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Manual charge</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a custom charge to this student's account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Description</Label>
            <Input
              type="text"
              placeholder="e.g., Late fee, Library fine, etc."
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              className="h-9 text-sm"
              required
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
              <DatePicker
                value={formData.date}
                onChange={(v) => setFormData((f) => ({ ...f, date: v }))}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-sm">
              Cancel
            </Button>
            <Button type="submit" className="h-9 text-sm bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]">
              Add charge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}