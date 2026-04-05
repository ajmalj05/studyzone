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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
import { ClassDto, MONTHS_2026 } from "@/types/fees";

interface GenerateOutstandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: {
    classId: string;
    month: string;
    includeTuition: boolean;
    includeBus: boolean;
    includeAdmission: boolean;
  }) => void;
  classes: ClassDto[];
}

export function GenerateOutstandingModal({
  isOpen,
  onClose,
  onGenerate,
  classes,
}: GenerateOutstandingModalProps) {
  const [formData, setFormData] = useState({
    classId: "",
    month: MONTHS_2026[0],
    includeTuition: true,
    includeBus: true,
    includeAdmission: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      classId: formData.classId,
      month: formData.month,
      includeTuition: formData.includeTuition,
      includeBus: formData.includeBus,
      includeAdmission: formData.includeAdmission,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Generate outstanding</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create monthly charges for students based on fee structures.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              Already-generated months will not be duplicated.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-sm">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Month</Label>
              <Select
                value={formData.month}
                onValueChange={(v) => setFormData((f) => ({ ...f, month: v }))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS_2026.map((m) => (
                    <SelectItem key={m} value={m} className="text-sm">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-sm">Fee types to include</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="tuition"
                  checked={formData.includeTuition}
                  onCheckedChange={(c) => setFormData((f) => ({ ...f, includeTuition: c as boolean }))}
                />
                <Label htmlFor="tuition" className="text-sm cursor-pointer">
                  Tuition fees
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bus"
                  checked={formData.includeBus}
                  onCheckedChange={(c) => setFormData((f) => ({ ...f, includeBus: c as boolean }))}
                />
                <Label htmlFor="bus" className="text-sm cursor-pointer">
                  Bus fees
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="admission"
                  checked={formData.includeAdmission}
                  onCheckedChange={(c) => setFormData((f) => ({ ...f, includeAdmission: c as boolean }))}
                />
                <Label htmlFor="admission" className="text-sm cursor-pointer">
                  Admission fees — new enrollments only
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-sm">
              Cancel
            </Button>
            <Button type="submit" className="h-9 text-sm bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]">
              Generate charges
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}