import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus, BookOpen, GraduationCap, Bus, AlertTriangle, Loader2 } from "lucide-react";
import { TuitionFee, AdmissionFee, BusFee, ClassDto, StudentDto, getStatusColor, formatCurrency } from "@/types/fees";
import { AddTuitionFeeModal } from "../modals/AddTuitionFeeModal";
import { AddAdmissionFeeModal } from "../modals/AddAdmissionFeeModal";
import { AssignBusFeeModal } from "../modals/AssignBusFeeModal";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAcademicYear } from "@/context/AcademicYearContext";

interface FeeSetupTabProps {
  classes: ClassDto[];
  students: StudentDto[];
}

export function FeeSetupTab({ classes, students }: FeeSetupTabProps) {
  const { selectedYearId } = useAcademicYear();
  const [tuitionFees, setTuitionFees] = useState<TuitionFee[]>([]);
  const [admissionFees, setAdmissionFees] = useState<AdmissionFee[]>([]);
  const [busFees, setBusFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [addTuitionOpen, setAddTuitionOpen] = useState(false);
  const [addAdmissionOpen, setAddAdmissionOpen] = useState(false);
  const [assignBusOpen, setAssignBusOpen] = useState(false);
  
  // Edit state
  const [editingTuition, setEditingTuition] = useState<any>(null);
  const [editingAdmission, setEditingAdmission] = useState<any>(null);
  const [editingBus, setEditingBus] = useState<any>(null);
  
  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ type: 'tuition' | 'admission' | 'bus'; id: string; name: string } | null>(null);

  // Load fees from backend
  const loadFees = async () => {
    try {
      setLoading(true);
      // Load all fee structures from backend and filter by type
      const url = selectedYearId
        ? `/Fees/structures?academicYearId=${encodeURIComponent(selectedYearId)}`
        : "/Fees/structures";
      const structures = (await fetchApi(url)) as any[];
      
      // Filter structures by name to categorize them
      setTuitionFees(structures.filter(s => s.name?.toLowerCase().includes("tuition")) || []);
      setAdmissionFees(structures.filter(s => s.name?.toLowerCase().includes("admission")) || []);
      setBusFees(structures.filter(s => s.name?.toLowerCase().includes("bus")) || []);
    } catch (e) {
      console.error("Failed to load fees", e);
      // Use empty arrays on error
      setTuitionFees([]);
      setAdmissionFees([]);
      setBusFees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [selectedYearId]);

  const handleAddTuition = async (data: { classId: string; amount: number; frequency: string }) => {
    try {
      setSaving(true);
      await fetchApi("/Fees/structures", {
        method: "POST",
        body: JSON.stringify({
          classId: data.classId,
          amount: data.amount,
          frequency: data.frequency,
          name: "Tuition fee",
          academicYearId: selectedYearId,
        }),
      });
      toast({ title: "Success", description: "Tuition fee added successfully" });
      setAddTuitionOpen(false);
      await loadFees();
    } catch (e: unknown) {
      toast({ 
        title: "Error", 
        description: (e as Error).message || "Failed to add tuition fee", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTuition = async (data: { classId: string; amount: number; frequency: string }) => {
    if (!editingTuition) return;
    try {
      setSaving(true);
      await fetchApi(`/Fees/structures/${editingTuition.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: "Tuition fee",
          amount: data.amount,
          frequency: data.frequency,
        }),
      });
      toast({ title: "Success", description: "Tuition fee updated successfully" });
      setAddTuitionOpen(false);
      setEditingTuition(null);
      await loadFees();
    } catch (e: unknown) {
      toast({ 
        title: "Error", 
        description: (e as Error).message || "Failed to update tuition fee", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmission = async (data: { classId: string; amount: number }) => {
    try {
      setSaving(true);
      await fetchApi("/Fees/structures", {
        method: "POST",
        body: JSON.stringify({
          classId: data.classId,
          amount: data.amount,
          frequency: "Once",
          name: "Admission fee",
          academicYearId: selectedYearId,
        }),
      });
      toast({ title: "Success", description: "Admission fee added successfully" });
      setAddAdmissionOpen(false);
      await loadFees();
    } catch (e: unknown) {
      toast({ 
        title: "Error", 
        description: (e as Error).message || "Failed to add admission fee", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAdmission = async (data: { classId: string; amount: number }) => {
    if (!editingAdmission) return;
    try {
      setSaving(true);
      await fetchApi(`/Fees/structures/${editingAdmission.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: "Admission fee",
          amount: data.amount,
          frequency: "Once",
        }),
      });
      toast({ title: "Success", description: "Admission fee updated successfully" });
      setAddAdmissionOpen(false);
      setEditingAdmission(null);
      await loadFees();
    } catch (e: unknown) {
      toast({ 
        title: "Error", 
        description: (e as Error).message || "Failed to update admission fee", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignBus = async (data: { studentId: string; amount: number; frequency: string; routeNote?: string }) => {
    try {
      setSaving(true);
      // Get the student's class info
      const student = students.find(s => s.id === data.studentId);
      if (!student) {
        toast({ title: "Error", description: "Student not found", variant: "destructive" });
        return;
      }
      
      // Include student name and route in the fee name so we can display it later
      const routePart = data.routeNote ? ` - ${data.routeNote}` : "";
      const feeName = `Bus fee - ${student.name}${routePart}`;
      
      await fetchApi("/Fees/structures", {
        method: "POST",
        body: JSON.stringify({
          classId: student.classId, // Use the student's class
          amount: data.amount,
          frequency: data.frequency,
          name: feeName,
          academicYearId: selectedYearId,
        }),
      });
      toast({ title: "Success", description: "Bus fee assigned successfully" });
      setAssignBusOpen(false);
      await loadFees();
    } catch (e: unknown) {
      toast({ 
        title: "Error", 
        description: (e as Error).message || "Failed to assign bus fee", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBus = async (data: { studentId: string; amount: number; frequency: string; routeNote?: string }) => {
    if (!editingBus) return;
    try {
      setSaving(true);
      
      // Get the student info from the form data
      const student = editingBus.studentId 
        ? students.find(s => s.id === editingBus.studentId)
        : students.find(s => s.name === editingBus.name?.split(" - ")[1]);
        
      const studentName = student?.name || "Student";
      const routePart = data.routeNote ? ` - ${data.routeNote}` : "";
      const feeName = `Bus fee - ${studentName}${routePart}`;
      
      await fetchApi(`/Fees/structures/${editingBus.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: feeName,
          amount: data.amount,
          frequency: data.frequency,
        }),
      });
      toast({ title: "Success", description: "Bus fee updated successfully" });
      setAssignBusOpen(false);
      setEditingBus(null);
      await loadFees();
    } catch (e: unknown) {
      toast({ 
        title: "Error", 
        description: (e as Error).message || "Failed to update bus fee", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteTuition = (id: string, name: string) => {
    setDeleteItem({ type: 'tuition', id, name });
    setDeleteModalOpen(true);
  };
  
  const confirmDeleteAdmission = (id: string, name: string) => {
    setDeleteItem({ type: 'admission', id, name });
    setDeleteModalOpen(true);
  };
  
  const confirmDeleteBus = (id: string, name: string) => {
    setDeleteItem({ type: 'bus', id, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    
    try {
      setSaving(true);
      const endpoint = `/Fees/structures/${deleteItem.id}`;
      
      await fetchApi(endpoint, { method: "DELETE" });
      toast({ title: "Success", description: "Fee deleted successfully" });
      await loadFees();
    } catch (e: unknown) {
      toast({ 
        title: "Error", 
        description: (e as Error).message || "Failed to delete fee", 
        variant: "destructive" 
      });
    } finally {
      setDeleteModalOpen(false);
      setDeleteItem(null);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tuition Fee Section */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-sm font-medium text-slate-700">
                <BookOpen className="h-3.5 w-3.5" />
                Tuition fee
              </div>
              <span className="text-sm text-slate-500">Monthly · Applied to all students in the class</span>
            </div>
            <Button 
              onClick={() => setAddTuitionOpen(true)}
              disabled={saving}
              className="h-9 text-sm bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add tuition fee
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Class</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Amount (AED)</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Frequency</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tuitionFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-sm text-slate-400">
                    No tuition fees added yet.
                  </TableCell>
                </TableRow>
              ) : (
                tuitionFees.map((fee) => (
                  <TableRow key={fee.id} className="border-b border-slate-100">
                    <TableCell className="font-medium text-slate-700">{fee.className}</TableCell>
                    <TableCell className="text-slate-600">{formatCurrency(fee.amount)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {fee.frequency}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-slate-700"
                          onClick={() => {
                            setEditingTuition(fee);
                            setAddTuitionOpen(true);
                          }}
                          disabled={saving}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-red-600" 
                          onClick={() => confirmDeleteTuition(fee.id, `${fee.className} - ${formatCurrency(fee.amount)}`)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Admission Fee Section */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-sm font-medium text-slate-700">
                <GraduationCap className="h-3.5 w-3.5" />
                Admission fee
              </div>
              <span className="text-sm text-slate-500">One-time · Charged on enrollment per class</span>
            </div>
            <Button 
              onClick={() => setAddAdmissionOpen(true)}
              disabled={saving}
              className="h-9 text-sm bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add admission fee
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Class</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Amount (AED)</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissionFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-sm text-slate-400">
                    No admission fees added yet.
                  </TableCell>
                </TableRow>
              ) : (
                admissionFees.map((fee) => (
                  <TableRow key={fee.id} className="border-b border-slate-100">
                    <TableCell className="font-medium text-slate-700">{fee.className}</TableCell>
                    <TableCell className="text-slate-600">{formatCurrency(fee.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-slate-700"
                          onClick={() => {
                            setEditingAdmission(fee);
                            setAddAdmissionOpen(true);
                          }}
                          disabled={saving}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-red-600"
                          onClick={() => confirmDeleteAdmission(fee.id, `${fee.className} - ${formatCurrency(fee.amount)}`)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bus Fee Section */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-sm font-medium text-slate-700">
                <Bus className="h-3.5 w-3.5" />
                Bus fee
              </div>
              <span className="text-sm text-slate-500">Monthly · Assigned per student individually</span>
            </div>
            <Button 
              onClick={() => setAssignBusOpen(true)}
              disabled={saving}
              className="h-9 text-sm bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Assign bus fee
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Student</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Class</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Amount (AED)</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Route / Note</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Frequency</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {busFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-slate-400">
                    No bus fees assigned yet.
                  </TableCell>
                </TableRow>
              ) : (
                busFees.map((fee) => {
                  // Parse the fee name to extract student name and route
                  // Format: "Bus fee - StudentName - RouteNote" or "Bus fee - StudentName"
                  const nameParts = fee.name?.split(" - ") || [];
                  
                  // Check if this is old format (e.g., "Bus fee - RouteName") or new format (e.g., "Bus fee - StudentName - RouteName")
                  // New format will have "Bus fee" as first part
                  let studentName: string;
                  let routeNote: string;
                  
                  if (nameParts[0] === "Bus fee") {
                    // New format: "Bus fee - Ahmed Hassan - Route A"
                    studentName = nameParts[1] || "Unknown";
                    routeNote = nameParts.slice(2).join(" - ") || "";
                  } else {
                    // Old format or corrupted: show full name as student, no route
                    studentName = "Unknown";
                    routeNote = fee.name || "";
                  }
                  
                  return (
                  <TableRow key={fee.id} className="border-b border-slate-100">
                    <TableCell className="font-medium text-slate-700">{studentName}</TableCell>
                    <TableCell className="text-slate-600">{fee.className}</TableCell>
                    <TableCell className="text-slate-600">{formatCurrency(fee.amount)}</TableCell>
                    <TableCell className="text-slate-600">{routeNote || "—"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {fee.frequency}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-slate-700"
                          onClick={() => {
                            setEditingBus(fee);
                            setAssignBusOpen(true);
                          }}
                          disabled={saving}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-red-600"
                          onClick={() => confirmDeleteBus(fee.id, `${studentName} - ${formatCurrency(fee.amount)}`)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddTuitionFeeModal
        isOpen={addTuitionOpen}
        onClose={() => {
          setAddTuitionOpen(false);
          setEditingTuition(null);
        }}
        onSave={editingTuition ? handleUpdateTuition : handleAddTuition}
        classes={classes}
        existingClassIds={tuitionFees.map(f => f.classId)}
        saving={saving}
        editData={editingTuition}
      />
      <AddAdmissionFeeModal
        isOpen={addAdmissionOpen}
        onClose={() => {
          setAddAdmissionOpen(false);
          setEditingAdmission(null);
        }}
        onSave={editingAdmission ? handleUpdateAdmission : handleAddAdmission}
        classes={classes}
        existingClassIds={admissionFees.map(f => f.classId)}
        saving={saving}
        editData={editingAdmission}
      />
      <AssignBusFeeModal
        isOpen={assignBusOpen}
        onClose={() => {
          setAssignBusOpen(false);
          setEditingBus(null);
        }}
        onSave={editingBus ? handleUpdateBus : handleAssignBus}
        students={students}
        existingStudentIds={busFees.map(f => {
          // Parse the fee name to get student ID
          // We need to match student name back to student ID
          const nameParts = f.name?.split(" - ") || [];
          if (nameParts[0] === "Bus fee" && nameParts[1]) {
            const studentName = nameParts[1];
            const student = students.find(s => s.name === studentName);
            return student?.id;
          }
          return null;
        }).filter(Boolean) as string[]}
        saving={saving}
        editData={editingBus}
      />
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteItem(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Fee Structure"
        description="Are you sure you want to delete this fee? This action cannot be undone."
        itemName={deleteItem?.name}
        saving={saving}
      />
    </div>
  );
}