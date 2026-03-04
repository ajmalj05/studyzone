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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
  teacherUserId?: string;
  teacherName?: string;
  isPublished: boolean;
}

interface TimetableSettingsDto {
  workingDayCount: number;
  periodsPerDay: number;
}

interface TeacherForSubjectDto {
  id: string;
  name: string;
}

interface BatchDto {
  id: string;
  name: string;
  className: string;
  classId?: string;
}

interface SubjectDto {
  id: string;
  name: string;
  code?: string;
}

const DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const WORKING_DAY_OPTIONS = [
  { value: 5, label: "Mon – Fri (5 days)" },
  { value: 6, label: "Mon – Sat (6 days)" },
  { value: 7, label: "Mon – Sun (7 days)" },
];

export default function Timetable() {
  const { selectedYearId } = useAcademicYear();
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [periods, setPeriods] = useState<PeriodConfigDto[]>([]);
  const [settings, setSettings] = useState<TimetableSettingsDto | null>(null);
  const [slots, setSlots] = useState<TimetableSlotDto[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [subjectsForClass, setSubjectsForClass] = useState<SubjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlotDto | null>(null);
  const [slotCell, setSlotCell] = useState<{ dayOfWeek: number; periodOrder: number } | null>(null);
  const [slotForm, setSlotForm] = useState({ subject: "", room: "", teacherUserId: "", teacherName: "" });
  const [subjectSearch, setSubjectSearch] = useState("");
  const [teachersForSubject, setTeachersForSubject] = useState<TeacherForSubjectDto[]>([]);
  const [settingsForm, setSettingsForm] = useState({ workingDayCount: 5, periodsPerDay: 6 });
  const [savingSettings, setSavingSettings] = useState(false);
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);

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

  const loadSettings = async () => {
    try {
      const data = (await fetchApi("/Timetable/settings")) as TimetableSettingsDto;
      setSettings(data);
      setSettingsForm({ workingDayCount: data.workingDayCount, periodsPerDay: data.periodsPerDay });
    } catch (_) {
      setSettings(null);
    }
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
      await Promise.all([loadBatches(), loadPeriods(), loadSettings()]);
      setLoading(false);
    })();
  }, [selectedYearId]);

  useEffect(() => {
    loadSlots();
  }, [selectedBatchId]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const selectedBatchClassId = selectedBatch?.classId;

  useEffect(() => {
    if (!selectedBatchClassId) {
      setSubjectsForClass([]);
      return;
    }
    fetchApi(`/Subjects/for-class/${selectedBatchClassId}`)
      .then((list: SubjectDto[]) => setSubjectsForClass(Array.isArray(list) ? list : []))
      .catch(() => setSubjectsForClass([]));
  }, [selectedBatchClassId]);

  useEffect(() => {
    if (!slotDialogOpen || !slotForm.subject.trim()) {
      setTeachersForSubject([]);
      return;
    }
    fetchApi(`/Timetable/teachers-for-subject?subjectName=${encodeURIComponent(slotForm.subject.trim())}`)
      .then((list: TeacherForSubjectDto[]) => setTeachersForSubject(Array.isArray(list) ? list : []))
      .catch(() => setTeachersForSubject([]));
  }, [slotDialogOpen, slotForm.subject]);

  const openSlotDialog = (dayOfWeek: number, periodOrder: number) => {
    const slot = getSlot(dayOfWeek, periodOrder);
    setSlotCell({ dayOfWeek, periodOrder });
    setEditingSlot(slot ?? null);
    setSlotForm({
      subject: slot?.subject ?? "",
      room: slot?.room ?? "",
      teacherUserId: slot?.teacherUserId ?? "",
      teacherName: slot?.teacherName ?? "",
    });
    setSubjectSearch("");
    setTeachersForSubject([]);
    if (slot?.subject) {
      fetchApi(`/Timetable/teachers-for-subject?subjectName=${encodeURIComponent(slot.subject)}`)
        .then((list: TeacherForSubjectDto[]) => setTeachersForSubject(Array.isArray(list) ? list : []))
        .catch(() => setTeachersForSubject([]));
    }
    setSlotDialogOpen(true);
  };

  const handleSaveSlot = async () => {
    if (!selectedBatchId) return;
    if (!slotForm.subject.trim()) {
      toast({ title: "Validation", description: "Select a subject.", variant: "destructive" });
      return;
    }
    const batch = batches.find((b) => b.id === selectedBatchId);
    const batchName = batch?.name ?? "";
    try {
      const body = editingSlot
        ? {
            id: editingSlot.id,
            batchId: selectedBatchId,
            batchName,
            dayOfWeek: editingSlot.dayOfWeek,
            periodOrder: editingSlot.periodOrder,
            subject: slotForm.subject.trim(),
            room: slotForm.room.trim() || undefined,
            teacherUserId: slotForm.teacherUserId || undefined,
            teacherName: slotForm.teacherName || undefined,
          }
        : {
            batchId: selectedBatchId,
            batchName,
            dayOfWeek: slotCell!.dayOfWeek,
            periodOrder: slotCell!.periodOrder,
            subject: slotForm.subject.trim(),
            room: slotForm.room.trim() || undefined,
            teacherUserId: slotForm.teacherUserId || undefined,
            teacherName: slotForm.teacherName || undefined,
          };
      await fetchApi("/Timetable/slot", { method: "POST", body: JSON.stringify(body) });
      toast({ title: "Success", description: editingSlot ? "Slot updated." : "Slot added." });
      setSlotDialogOpen(false);
      loadSlots();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to save slot", variant: "destructive" });
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetchApi("/Timetable/settings", {
        method: "PUT",
        body: JSON.stringify(settingsForm),
      });
      toast({ title: "Success", description: "Timetable settings saved." });
      await loadSettings();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to save settings", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

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

  const useSettingsForGrid = settings && settings.workingDayCount >= 1 && settings.periodsPerDay >= 1;
  const daysInUse = useSettingsForGrid
    ? Array.from({ length: settings!.workingDayCount }, (_, i) => i + 1)
    : [...new Set(periods.map((p) => p.dayOfWeek))].sort((a, b) => a - b);
  const periodOrders = useSettingsForGrid
    ? Array.from({ length: settings!.periodsPerDay }, (_, i) => i + 1)
    : [...new Set(periods.map((p) => p.periodOrder))].sort((a, b) => a - b);

  const filteredSubjects = subjectSearch.trim()
    ? subjectsForClass.filter(
        (s) =>
          s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
          (s.code?.toLowerCase().includes(subjectSearch.toLowerCase()) ?? false)
      )
    : subjectsForClass;

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
              <CardTitle>Timetable settings</CardTitle>
              <CardDescription>Set working days and periods per day. The timetable grid will use these to show columns and rows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label>Working days</Label>
                  <Select
                    value={String(settingsForm.workingDayCount)}
                    onValueChange={(v) => setSettingsForm((f) => ({ ...f, workingDayCount: parseInt(v, 10) }))}
                  >
                    <SelectTrigger className="w-[200px] rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKING_DAY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Periods per day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    className="w-24 rounded-xl"
                    value={settingsForm.periodsPerDay}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, periodsPerDay: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                  />
                </div>
                <Button className="rounded-xl" onClick={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings ? "Saving..." : "Save settings"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timetable per batch</CardTitle>
              <CardDescription>Add and edit timetable for each batch (e.g. Class 8-A, 8-B). Publish so teachers and students can see it.</CardDescription>
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
                <>
                  {subjectsForClass.length === 0 && selectedBatchClassId && (
                    <p className="text-sm text-muted-foreground">Map subjects to this class in the Subjects page to add slots.</p>
                  )}
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
                                <td
                                  key={`${d}-${po}`}
                                  className="border p-2 min-w-[120px] cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => openSlotDialog(d, po)}
                                >
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
                </>
              )}
              {!selectedBatchId && <p className="text-muted-foreground">Select a batch to view timetable.</p>}
            </CardContent>
          </Card>

          <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>{editingSlot ? "Edit slot" : "Add slot"}</DialogTitle>
                <DialogDescription>
                  {slotCell != null && `${DAYS[slotCell.dayOfWeek]} – Period ${slotCell.periodOrder}. Choose a subject from the list.`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  {subjectsForClass.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subjects mapped to this class. Map them in the Subjects page.</p>
                  ) : (
                    <Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={subjectPopoverOpen}
                          className={cn("w-full justify-between rounded-xl font-normal", !slotForm.subject && "text-muted-foreground")}
                        >
                          {slotForm.subject || "Search and select subject..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search subject..."
                            value={subjectSearch}
                            onValueChange={setSubjectSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No subject found.</CommandEmpty>
                            <CommandGroup>
                              {editingSlot && slotForm.subject && !subjectsForClass.some((s) => s.name === slotForm.subject) && (
                                <CommandItem
                                  value={slotForm.subject}
                                  onSelect={() => {
                                    setSlotForm((f) => ({ ...f, subject: slotForm.subject }));
                                    setSubjectPopoverOpen(false);
                                  }}
                                >
                                  {slotForm.subject} (current)
                                </CommandItem>
                              )}
                              {filteredSubjects.map((s) => (
                                <CommandItem
                                  key={s.id}
                                  value={`${s.name} ${s.code ?? ""}`}
                                  onSelect={() => {
                                    setSlotForm((f) => ({ ...f, subject: s.name, teacherUserId: "", teacherName: "" }));
                                    setSubjectSearch("");
                                    setSubjectPopoverOpen(false);
                                  }}
                                >
                                  {s.name}{s.code ? ` (${s.code})` : ""}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Teacher</Label>
                  {slotForm.subject ? (
                    teachersForSubject.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No teachers assigned for this subject.</p>
                    ) : (
                      <Select
                        value={slotForm.teacherUserId || "_none"}
                        onValueChange={(v) => {
                          if (v === "_none") {
                            setSlotForm((f) => ({ ...f, teacherUserId: "", teacherName: "" }));
                          } else {
                            const t = teachersForSubject.find((x) => x.id === v);
                            setSlotForm((f) => ({ ...f, teacherUserId: v, teacherName: t?.name ?? "" }));
                          }
                        }}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">None</SelectItem>
                          {teachersForSubject.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a subject first to choose a teacher.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Room (optional)</Label>
                  <Input
                    value={slotForm.room}
                    onChange={(e) => setSlotForm((f) => ({ ...f, room: e.target.value }))}
                    placeholder="Room"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setSlotDialogOpen(false)}>Cancel</Button>
                <Button
                  className="rounded-xl"
                  onClick={handleSaveSlot}
                  disabled={subjectsForClass.length === 0 || !slotForm.subject.trim()}
                >
                  {editingSlot ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
    </div>
  );
}
