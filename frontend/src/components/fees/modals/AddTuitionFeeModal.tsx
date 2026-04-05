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
import { ClassDto } from "@/types/fees";

interface AddTuitionFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    classId: string;
    amount: number;
    frequency: string;
  }) => void;
  classes: ClassDto[];
  existingClassIds?: string[];
  saving?: boolean;
  editData?: any;
}

export function AddTuitionFeeModal({
  isOpen,
  onClose,
  onSave,
  classes,
  existingClassIds = [],
  saving,
  editData,
}: AddTuitionFeeModalProps) {
  
  // Filter out classes that already have tuition fees (unless editing)
  const availableClasses = editData 
    ? classes 
    : classes.filter(c => !existingClassIds.includes(c.id));
  
  const isEditing = !!editData;
  const [formData, setFormData] = useState({
    classId: "",
    amount: "",
    frequency: "Monthly",
  });

  // Populate form when editing
  useEffect(() => {
    if (isOpen && editData) {
      setFormData({
        classId: editData.classId || "",
        amount: String(editData.amount) || "",
        frequency: editData.frequency || "Monthly",
      });
    } else if (isOpen && !editData) {
      setFormData({
        classId: "",
        amount: "",
        frequency: "Monthly",
      });
    }
  }, [isOpen, editData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      classId: formData.classId,
      amount: Number(formData.amount),
      frequency: formData.frequency,
    });
    setFormData({
      classId: "",
      amount: "",
      frequency: "Monthly",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">{isEditing ? "Edit tuition fee" : "Add tuition fee"}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create a new tuition fee structure for a class.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Class</Label>
            <Select
              value={formData.classId}
              onValueChange={(v) => setFormData((f) => ({ ...f, classId: v }))}
              required
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-slate-500 text-center">
                    All classes already have tuition fees
                  </div>
                ) : (
                  availableClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-sm">
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

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
            <Label className="text-sm">Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(v) => setFormData((f) => ({ ...f, frequency: v }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly" className="text-sm">Monthly</SelectItem>
                <SelectItem value="Per term" className="text-sm">Per term</SelectItem>
                <SelectItem value="Annual" className="text-sm">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="h-9 text-sm bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]">
              {saving ? "Saving..." : (isEditing ? "Update" : "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}