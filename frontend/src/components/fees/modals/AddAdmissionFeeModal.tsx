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

interface AddAdmissionFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    classId: string;
    amount: number;
  }) => void;
  classes: ClassDto[];
  existingClassIds?: string[];
  saving?: boolean;
  editData?: any;
}

export function AddAdmissionFeeModal({
  isOpen,
  onClose,
  onSave,
  classes,
  existingClassIds = [],
  saving,
  editData,
}: AddAdmissionFeeModalProps) {
  
  // Filter out classes that already have admission fees (unless editing)
  const availableClasses = editData 
    ? classes 
    : classes.filter(c => !existingClassIds.includes(c.id));
  
  const isEditing = !!editData;
  
  const [formData, setFormData] = useState({
    classId: "",
    amount: "",
  });

  // Populate form when editing
  useEffect(() => {
    if (isOpen && editData) {
      setFormData({
        classId: editData.classId || "",
        amount: String(editData.amount) || "",
      });
    } else if (isOpen && !editData) {
      setFormData({
        classId: "",
        amount: "",
      });
    }
  }, [isOpen, editData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      classId: formData.classId,
      amount: Number(formData.amount),
    });
    if (!editData) {
      setFormData({
        classId: "",
        amount: "",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">{isEditing ? "Edit admission fee" : "Add admission fee"}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Set a one-time admission fee for a class.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Class</Label>
            {isEditing ? (
              <div className="h-9 px-3 py-2 text-sm border rounded-md bg-slate-50 text-slate-600">
                {classes.find(c => c.id === formData.classId)?.name || "Class"}
              </div>
            ) : (
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
                      All classes already have admission fees
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
            )}
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