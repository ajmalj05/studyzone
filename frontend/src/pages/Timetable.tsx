import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useAcademicYear } from "@/context/AcademicYearContext";
import { CalendarDays } from "lucide-react";

interface PeriodConfigDto {
  id: string;
  dayOfWeek: number;
  periodOrder: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  label?: string;
}

interface TimetableSlotDto {
  id: string;
  batchId: string;
  batchName: string;
  dayOfWeek: number;
  periodOrder: number;
  subject: string;
  room?: string;
  teacherName?: string;
  isPublished: boolean;
}

interface BatchDto {
  id: string;
  name: string;
  className: string;
}

const DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Timetable() {
  const { selectedYearId } = useAcademicYear();
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [periods, setPeriods] = useState<PeriodConfigDto[]>([]);
  const [slots, setSlots] = useState<TimetableSlotDto[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadBatches = async () => {
    try {
      const url = selectedYearId ? `/Batches?academicYearId=${encodeURIComponent(selectedYearId)}` : "/Batches";
      const list = (await fetchApi(url)) as BatchDto[];
      setBatches(list);
    } catch (_) {}
  };

  const loadPeriods = async () => {
    try {
      const list = (await fetchApi("/Timetable/period-config")) as PeriodConfigDto[];
      setPeriods(list.filter((p) => !p.isBreak).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.periodOrder - b.periodOrder));
    } catch (_) {}
  };

  const loadSlots = async () => {
    if (!selectedBatchId) {
      setSlots([]);
      return;
    }
    try {
      const list = (await fetchApi(`/Timetable/batch/${selectedBatchId}`)) as TimetableSlotDto[];
      setSlots(list);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load timetable", variant: "destructive" });
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadBatches(), loadPeriods()]);
      setLoading(false);
    })();
  }, [selectedYearId]);

  useEffect(() => {
    loadSlots();
  }, [selectedBatchId]);

  const handlePublish = async () => {
    if (!selectedBatchId) return;
    try {
      await fetchApi(`/Timetable/batch/${selectedBatchId}/publish`, { method: "POST" });
      toast({ title: "Success", description: "Timetable published." });
      await loadSlots();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed", variant: "destructive" });
    }
  };

  const getSlot = (dayOfWeek: number, periodOrder: number) =>
    slots.find((s) => s.dayOfWeek === dayOfWeek && s.periodOrder === periodOrder);

  const periodOrders = [...new Set(periods.map((p) => p.periodOrder))].sort((a, b) => a - b);
  const daysInUse = [...new Set(periods.map((p) => p.dayOfWeek))].sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardHeader title="Timetable" />
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timetable per batch</CardTitle>
              <CardDescription>Each batch (e.g. Class 8-A, 8-B) has its own timetable since they run at the same time. Select a batch to view or edit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Label>Batch</Label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{batches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.className} - {b.name}</SelectItem>))}</SelectContent>
                </Select>
                {selectedBatchId && (
                  <Button variant="outline" size="sm" onClick={handlePublish}>Publish timetable</Button>
                )}
              </div>
              {selectedBatchId && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-muted/50 w-14">Period</th>
                        {daysInUse.map((d) => (
                          <th key={d} className="border p-2 bg-muted/50">{DAYS[d]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {periodOrders.map((po) => (
                        <tr key={po}>
                          <td className="border p-2 font-medium">{po}</td>
                          {daysInUse.map((d) => {
                            const slot = getSlot(d, po);
                            return (
                              <td key={`${d}-${po}`} className="border p-2 min-w-[120px]">
                                {slot ? (
                                  <div className="text-xs">
                                    <div className="font-medium">{slot.subject}</div>
                                    {slot.room && <div>{slot.room}</div>}
                                    {slot.teacherName && <div className="text-muted-foreground">{slot.teacherName}</div>}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!selectedBatchId && <p className="text-muted-foreground">Select a batch to view timetable.</p>}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
