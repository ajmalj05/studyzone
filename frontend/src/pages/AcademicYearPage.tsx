import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { Calendar, Plus } from "lucide-react";

interface AcademicYearDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isArchived: boolean;
}

export default function AcademicYearPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYearDto[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYearDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newYearForm, setNewYearForm] = useState({ name: "", startDate: "", endDate: "" });

  const loadAcademicYears = async () => {
    try {
      const list = await fetchApi("/AcademicYears?includeArchived=true") as AcademicYearDto[];
      setAcademicYears(list.map((y: Record<string, unknown>) => ({
        id: y.id as string,
        name: y.name as string,
        startDate: (y.startDate as string).split("T")[0],
        endDate: (y.endDate as string).split("T")[0],
        isCurrent: y.isCurrent as boolean,
        isArchived: y.isArchived as boolean,
      })));
      const current = await fetchApi("/AcademicYears/current") as AcademicYearDto | null;
      if (current) {
        setCurrentYear({
          ...current,
          startDate: (current.startDate as string).split("T")[0],
          endDate: (current.endDate as string).split("T")[0],
        });
      } else {
        setCurrentYear(null);
      }
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
      const current = await fetchApi("/AcademicYears/current") as AcademicYearDto | null;
      if (current) {
        setCurrentYear({
          ...current,
          startDate: (current.startDate as string).split("T")[0],
          endDate: (current.endDate as string).split("T")[0],
        });
      }
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to set current year",
        variant: "destructive",
      });
    }
  };

  const handleCreateAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearForm.name.trim() || !newYearForm.startDate || !newYearForm.endDate) {
      toast({
        title: "Validation",
        description: "Name, start date and end date are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      await fetchApi("/AcademicYears", {
        method: "POST",
        body: JSON.stringify({
          name: newYearForm.name.trim(),
          startDate: newYearForm.startDate,
          endDate: newYearForm.endDate,
        }),
      });
      toast({ title: "Success", description: "Academic year created." });
      setNewYearForm({ name: "", startDate: "", endDate: "" });
      setAddModalOpen(false);
      await loadAcademicYears();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message || "Failed to create",
        variant: "destructive",
      });
    }
  };

  const activeYears = academicYears.filter((y) => !y.isArchived);

  return (
    <div className="space-y-4">
      <DashboardHeader title="Academic Year" />
      <p className="text-muted-foreground text-sm">
        Add and manage academic years (e.g. 2024-2025). Set one as current so new admissions and forms use it.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Current Academic Year
              </CardTitle>
              <CardDescription>
                The active year used for new applications and admission numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentYear ? (
                <p className="text-sm">
                  Current: <strong>{currentYear.name}</strong> ({currentYear.startDate} – {currentYear.endDate})
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No academic year set as current. Add a year below and set it as current.
                </p>
              )}
              <div className="space-y-2">
                {activeYears.map((y) => (
                  <div
                    key={y.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span>
                      {y.name} ({y.startDate} – {y.endDate})
                      {y.isCurrent && (
                        <span className="ml-2 text-primary font-medium">(Current)</span>
                      )}
                    </span>
                    {!y.isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetCurrentYear(y.id)}
                      >
                        Set as current
                      </Button>
                    )}
                  </div>
                ))}
                {activeYears.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">
                    No academic years yet. Add one below.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add academic year
          </Button>

          <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add academic year</DialogTitle>
                <DialogDescription>
                  Create a new academic year (e.g. 2025-2026 for the next year).
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAcademicYear} className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={newYearForm.name}
                    onChange={(e) =>
                      setNewYearForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. 2024-2025 or 2025-2026"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={newYearForm.startDate}
                    onChange={(e) =>
                      setNewYearForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>End date</Label>
                  <Input
                    type="date"
                    value={newYearForm.endDate}
                    onChange={(e) =>
                      setNewYearForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
