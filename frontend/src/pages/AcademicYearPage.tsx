import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { Calendar, Plus, Check, Archive } from "lucide-react";
import { AcademicsCardIconLead } from "@/components/AcademicsCardIconLead";

interface AcademicYearDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isArchived: boolean;
}

export default function AcademicYearPage() {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState<AcademicYearDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newYearForm, setNewYearForm] = useState({ name: "", startDate: "", endDate: "" });

  const loadAcademicYears = async () => {
    try {
      const list = await fetchApi("/AcademicYears?includeArchived=true") as AcademicYearDto[];
      setAcademicYears(list.map((y: AcademicYearDto) => ({
        id: y.id as string,
        name: y.name as string,
        startDate: (y.startDate as string).split("T")[0],
        endDate: (y.endDate as string).split("T")[0],
        isCurrent: y.isCurrent as boolean,
        isArchived: y.isArchived as boolean,
      })));
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to load academic years",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadAcademicYears();
      setLoading(false);
    })();
  }, []);

  const handleSetCurrentYear = async (id: string) => {
    try {
      await fetchApi(`/AcademicYears/${id}/set-current`, { method: "POST" });
      toast({ title: "Success", description: "Current academic year updated." });
      await loadAcademicYears();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to set current year",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await fetchApi(`/AcademicYears/${id}/archive`, { method: "POST" });
      toast({ title: "Success", description: "Year archived." });
      await loadAcademicYears();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to archive",
        variant: "destructive",
      });
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await fetchApi(`/AcademicYears/${id}/unarchive`, { method: "POST" });
      toast({ title: "Success", description: "Year unarchived." });
      await loadAcademicYears();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to unarchive",
        variant: "destructive",
      });
    }
  };

  const handleAddYear = async () => {
    if (!newYearForm.name.trim() || !newYearForm.startDate || !newYearForm.endDate) {
      toast({ title: "Validation", description: "All fields are required", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/AcademicYears", {
        method: "POST",
        body: JSON.stringify({
          name: newYearForm.name,
          startDate: newYearForm.startDate,
          endDate: newYearForm.endDate,
        }),
      });
      toast({ title: "Success", description: "Academic year created." });
      setAddModalOpen(false);
      setNewYearForm({ name: "", startDate: "", endDate: "" });
      await loadAcademicYears();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to create",
        variant: "destructive",
      });
    }
  };

  // Table columns
  const yearColumns: DataTableColumn<AcademicYearDto>[] = [
    {
      key: "name",
      header: "Year",
      cell: (y) => (
        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{y.name}</span>
          {y.isCurrent && (
            <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Current</Badge>
          )}
        </div>
      ),
    },
    {
      key: "period",
      header: "Period",
      cell: (y) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {new Date(y.startDate).toLocaleDateString()} - {new Date(y.endDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      badge: (y) => y.isArchived 
        ? { label: "Archived", variant: "secondary" }
        : y.isCurrent 
          ? { label: "Active", variant: "success" }
          : { label: "Inactive", variant: "default" },
    },

    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-[120px]",
      cell: (y) => (
        <div className="flex items-center justify-end gap-2">
          {!y.isCurrent && !y.isArchived && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => handleSetCurrentYear(y.id)}
            >
              <Check className="h-3 w-3 mr-1" /> Set Current
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
          <AcademicsCardIconLead
            icon={Calendar}
            title="Academic Years"
            description=""
          />
          <Button onClick={() => setAddModalOpen(true)} className="shrink-0 gap-2 rounded-lg">
            <Plus className="h-4 w-4" /> Add Year
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={academicYears}
            columns={yearColumns}
            keyExtractor={(y) => y.id}
            emptyMessage="No academic years found"
            emptyDescription="Add your first academic year to get started"
          />
        </CardContent>
      </Card>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Academic Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newYearForm.name}
                onChange={(e) => setNewYearForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 2024-2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <DatePicker
                  value={newYearForm.startDate}
                  onChange={(v) => setNewYearForm((f) => ({ ...f, startDate: v }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <DatePicker
                  value={newYearForm.endDate}
                  onChange={(v) => setNewYearForm((f) => ({ ...f, endDate: v }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddYear}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}