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

interface AssignBusFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    studentId: string;
    amount: number;
    frequency: string;
    routeNote?: string;
  }) => void;
  students: StudentDto[];
  existingStudentIds?: string[];
  saving?: boolean;
  editData?: any;
}

export function AssignBusFeeModal({
  isOpen,
  onClose,
  onSave,
  students,
  existingStudentIds = [],
  saving,
  editData,
}: AssignBusFeeModalProps) {
  
  const isEditing = !!editData;
  
  const [formData, setFormData] = useState({
    studentId: "",
    amount: "",
    frequency: "Monthly",
    routeNote: "",
  });

  // Parse editData to extract student info from fee name
  useEffect(() => {
    if (isOpen && editData) {
      // Parse fee name: "Bus fee - StudentName - RouteNote"
      const nameParts = editData.name?.split(" - ") || [];
      let studentName = "";
      let routeNote = "";
      
      if (nameParts[0] === "Bus fee" && nameParts.length >= 2) {
        studentName = nameParts[1] || "";
        routeNote = nameParts.slice(2).join(" - ") || "";
      }
      
      // Find student by name
      const student = students.find(s => s.name === studentName);
      
      setFormData({
        studentId: student?.id || editData.studentId || "",
        amount: String(editData.amount) || "",
        frequency: editData.frequency || "Monthly",
        routeNote: routeNote,
      });
    } else if (isOpen && !editData) {
      setFormData({
        studentId: "",
        amount: "",
        frequency: "Monthly",
        routeNote: "",
      });
    }
  }, [isOpen, editData, students]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      studentId: formData.studentId,
      amount: Number(formData.amount),
      frequency: formData.frequency,
      routeNote: formData.routeNote || undefined,
    });
    if (!editData) {
      setFormData({
        studentId: "",
        amount: "",
        frequency: "Monthly",
        routeNote: "",
      });
    }
  };

  // Find student name for display when editing
  const selectedStudent = students.find(s => s.id === formData.studentId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">{isEditing ? "Edit bus fee" : "Assign bus fee"}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing ? "Update bus transportation fee for the student." : "Assign bus transportation fee to a student."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Student</Label>
            {isEditing ? (
              <div className="h-9 px-3 py-2 text-sm border rounded-md bg-slate-50 text-slate-600">
                {selectedStudent ? `${selectedStudent.name} (${selectedStudent.admissionNumber})` : "Student"}
              </div>
            ) : (
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
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Route / Note (optional)</Label>
            <Input
              type="text"
              placeholder="e.g., Route A - Dubai Marina"
              value={formData.routeNote}
              onChange={(e) => setFormData((f) => ({ ...f, routeNote: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="h-9 text-sm bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]">
              {saving ? (isEditing ? "Updating..." : "Assigning...") : (isEditing ? "Update" : "Assign")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}