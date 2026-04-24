import { useState, useEffect } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TimePicker } from "@/components/ui/time-picker";
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
import { CalendarDays, Coffee, Globe, LayoutGrid, Plus, Settings2, X } from "lucide-react";
import { AcademicsCardIconLead } from "@/components/AcademicsCardIconLead";

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

interface TimetableBreakDto {
  id: string;
  afterPeriod: number;
  durationMinutes: number;
  appliesTo: string;
}

interface TimetableSettingsDto {
  workingDayCount: number;
  periodsPerDay: number;
  schoolStartTime?: string;
  periodDurationMinutes?: number;
  breaks?: TimetableBreakDto[];
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

function createClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeTimeForInput(value: string | undefined): string {
  if (!value?.trim()) return "08:00";
  const m = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "08:00";
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function newBreakRow(periodsPerDay: number): TimetableBreakDto {
  return {
    id: createClientId(),
    afterPeriod: Math.min(3, Math.max(1, periodsPerDay)),
    durationMinutes: 20,
    appliesTo: "all",
  };
}

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
  const [settingsForm, setSettingsForm] = useState({
    workingDayCount: 5,
    periodsPerDay: 6,
    schoolStartTime: "08:00",
    periodDurationMinutes: 45,
    breaks: [] as TimetableBreakDto[],
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);

  usePageHeaderConfigEffect(
    { title: "Timetable", description: "Configure periods, slots, and publish batch timetables." },
    [],
  );

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
      const breaksRaw = Array.isArray(data.breaks) ? data.breaks : [];
      const breaks: TimetableBreakDto[] = breaksRaw.map((b) => ({
        id: b.id || createClientId(),
        afterPeriod: typeof b.afterPeriod === "number" ? b.afterPeriod : 1,
        durationMinutes: typeof b.durationMinutes === "number" ? b.durationMinutes : 15,
        appliesTo: typeof b.appliesTo === "string" && b.appliesTo ? b.appliesTo : "all",
      }));
      setSettingsForm({
        workingDayCount: data.workingDayCount,
        periodsPerDay: data.periodsPerDay,
        schoolStartTime: normalizeTimeForInput(data.schoolStartTime),
        periodDurationMinutes:
          typeof data.periodDurationMinutes === "number" && data.periodDurationMinutes > 0
            ? data.periodDurationMinutes
            : 45,
        breaks,
      });
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
      const ppd = Math.max(1, Math.min(20, settingsForm.periodsPerDay));
      const duration = Math.max(5, Math.min(180, settingsForm.periodDurationMinutes || 45));
      const payload = {
        workingDayCount: Math.max(1, Math.min(7, settingsForm.workingDayCount)),
        periodsPerDay: ppd,
        schoolStartTime: normalizeTimeForInput(settingsForm.schoolStartTime),
        periodDurationMinutes: duration,
        breaks: settingsForm.breaks.map((b) => ({
          id: b.id || createClientId(),
          afterPeriod: Math.max(1, Math.min(ppd, b.afterPeriod || 1)),
          durationMinutes: Math.max(1, Math.min(120, b.durationMinutes || 15)),
          appliesTo: b.appliesTo || "all",
        })),
      };
      await fetchApi("/Timetable/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
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

  const fieldLabelClass = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

  const updateBreak = (id: string, patch: Partial<TimetableBreakDto>) => {
    setSettingsForm((f) => ({
      ...f,
      breaks: f.breaks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const removeBreak = (id: string) => {
    setSettingsForm((f) => ({ ...f, breaks: f.breaks.filter((b) => b.id !== id) }));
  };

  const addBreak = () => {
    setSettingsForm((f) => ({
      ...f,
      breaks: [...f.breaks, newBreakRow(f.periodsPerDay)],
    }));
  };

  // ── Calendar view helpers ─────────────────────────────────────────────────
  const PX_PER_MIN = 2;

  function fmtMin(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }

  interface TimeBlock {
    type: "period" | "break";
    periodOrder?: number;
    startMinutes: number;
    endMinutes: number;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    appliesTo?: string;
  }

  function buildTimeline(): TimeBlock[] {
    if (!settings) return [];
    const [startH, startM] = (settings.schoolStartTime || "08:00").split(":").map(Number);
    let cur = startH * 60 + startM;
    const dur = settings.periodDurationMinutes || 45;
    const breaks = settings.breaks || [];
    const blocks: TimeBlock[] = [];

    for (let p = 1; p <= settings.periodsPerDay; p++) {
      const s = cur;
      const e = cur + dur;
      blocks.push({ type: "period", periodOrder: p, startMinutes: s, endMinutes: e, startTime: fmtMin(s), endTime: fmtMin(e), durationMinutes: dur });
      cur = e;
      const brk = breaks.find((b) => b.afterPeriod === p);
      if (brk) {
        const be = cur + brk.durationMinutes;
        blocks.push({ type: "break", startMinutes: cur, endMinutes: be, startTime: fmtMin(cur), endTime: fmtMin(be), durationMinutes: brk.durationMinutes, appliesTo: brk.appliesTo });
        cur = be;
      }
    }
    return blocks;
  }

  const timeline = buildTimeline();
  // ── End calendar helpers ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-col gap-4 border-b border-border/50 bg-card px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0 sm:px-6">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-500/12 text-violet-700 shadow-sm dark:bg-violet-500/20 dark:text-violet-200"
                aria-hidden
              >
                <Settings2 className="h-6 w-6" strokeWidth={2} />
              </div>
              <AcademicsCardIconLead
                icon={Settings2}
                title="Timetable settings"
                description="Configure working days, period length, school start time, and break times. Save before editing batch grids."
              />
            </div>
            <Button
              type="button"
              className="h-10 shrink-0 rounded-lg px-5 shadow-sm"
              onClick={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? "Saving…" : "Save settings"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-8 bg-card px-5 py-6 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4 shadow-sm dark:bg-muted/10">
                <Label className={fieldLabelClass}>Working days</Label>
                <SearchableSelect
                  value={String(settingsForm.workingDayCount)}
                  onValueChange={(v) => setSettingsForm((f) => ({ ...f, workingDayCount: parseInt(v, 10) }))}
                  options={WORKING_DAY_OPTIONS.map((opt) => ({ value: String(opt.value), label: opt.label }))}
                />
              </div>
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4 shadow-sm dark:bg-muted/10">
                <Label className={fieldLabelClass}>Periods per day</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  className="h-10 rounded-lg border-border/70 bg-background font-medium tabular-nums"
                  value={settingsForm.periodsPerDay}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, periodsPerDay: Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)) }))
                  }
                />
              </div>
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4 shadow-sm dark:bg-muted/10">
                <Label className={fieldLabelClass}>School start time</Label>
                <TimePicker
                  value={settingsForm.schoolStartTime}
                  onChange={(v) => setSettingsForm((f) => ({ ...f, schoolStartTime: v }))}
                  placeholder="Select start time"
                  interval={15}
                  presets={[
                    { label: "7 AM", time: "07:00" },
                    { label: "8 AM", time: "08:00" },
                    { label: "9 AM", time: "09:00" },
                  ]}
                />
              </div>
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4 shadow-sm dark:bg-muted/10">
                <Label className={fieldLabelClass}>Period duration (min)</Label>
                <Input
                  type="number"
                  min={5}
                  max={180}
                  className="h-10 rounded-lg border-border/70 bg-background font-medium tabular-nums"
                  value={settingsForm.periodDurationMinutes}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      periodDurationMinutes: Math.max(5, Math.min(180, parseInt(e.target.value, 10) || 45)),
                    }))
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground">
                    <Coffee className="h-4 w-4 shrink-0 text-amber-700/80 dark:text-amber-400/90" aria-hidden />
                    <h3 className="text-base font-semibold tracking-tight sm:text-lg">Break times</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Add a break after any period. You can set who it applies to. Break rules are stored with
                    settings; the slot grid still follows periods per day until generation is wired to these rules.
                  </p>
                </div>
                <Button
                  type="button"
                  // variant="outline"
                  className="h-10 shrink-0 gap-2 self-start rounded-lg sm:self-auto"
                  onClick={addBreak}
                >
                  <Plus className="h-4 w-4" />
                  Add break
                </Button>
              </div>
              <div className="mt-5 space-y-3">
                {settingsForm.breaks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    No breaks yet. Use <span className="font-medium text-foreground">Add break</span> to insert one after a period.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {settingsForm.breaks.map((b, index) => (
                      <li
                        key={b.id}
                        className="rounded-lg border border-border/60 bg-card p-3 shadow-sm sm:p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary font-mono text-sm font-semibold tabular-nums text-secondary-foreground"
                            aria-hidden
                          >
                            B{index + 1}
                          </div>
                          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label className={fieldLabelClass}>After period</Label>
                              <Input
                                type="number"
                                min={1}
                                max={settingsForm.periodsPerDay}
                                className="h-10 rounded-lg"
                                value={b.afterPeriod}
                                onChange={(e) =>
                                  updateBreak(b.id, {
                                    afterPeriod: Math.max(
                                      1,
                                      Math.min(settingsForm.periodsPerDay, parseInt(e.target.value, 10) || 1),
                                    ),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className={fieldLabelClass}>Duration (min)</Label>
                              <Input
                                type="number"
                                min={1}
                                max={120}
                                className="h-10 rounded-lg"
                                value={b.durationMinutes}
                                onChange={(e) =>
                                  updateBreak(b.id, { durationMinutes: Math.max(1, parseInt(e.target.value, 10) || 15) })
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className={fieldLabelClass}>Who gets break</Label>
                              <SearchableSelect
                                value={b.appliesTo}
                                onValueChange={(v) => updateBreak(b.id, { appliesTo: v })}
                                options={[
                                  { value: "all", label: "All batches" },
                                  ...batches.map((batch) => ({ value: batch.id, label: `${batch.className} - ${batch.name}` })),
                                ]}
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                            onClick={() => removeBreak(b.id)}
                            aria-label={`Remove break ${index + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/50 bg-card px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sky-500/12 text-sky-800 shadow-sm dark:bg-sky-500/18 dark:text-sky-200"
                  aria-hidden
                >
                  <LayoutGrid className="h-6 w-6" strokeWidth={2} />
                </div>
                <AcademicsCardIconLead
                  icon={LayoutGrid}
                  title="Timetable per batch"
                  description="Click any cell to assign a subject and teacher. Publish when this batch’s timetable is ready."
                />
              </div>
              <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-end sm:justify-end">
                <div className="w-full space-y-2 sm:w-[min(100%,240px)]">
                  <Label className={fieldLabelClass}>Batch</Label>
                  <SearchableSelect
                    value={selectedBatchId}
                    onValueChange={setSelectedBatchId}
                    placeholder="Select batch…"
                    options={batches.map((b) => ({ value: b.id, label: `${b.className} — ${b.name}` }))}
                  />
                </div>
                {selectedBatchId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="h-10 shrink-0 gap-2 rounded-lg border-primary/25 bg-background"
                    onClick={handlePublish}
                  >
                    <Globe className="h-4 w-4 text-primary" aria-hidden />
                    Publish
                  </Button>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5 py-6 sm:px-6">
            {selectedBatchId && (
              <>
                {subjectsForClass.length === 0 && selectedBatchClassId && (
                  <p className="text-sm text-muted-foreground">
                    Map subjects to this class on the Subjects page to pick subjects in slots.
                  </p>
                )}

                {timeline.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-12 text-center">
                    <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground">No timetable configured yet</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Fill in the settings above and click <span className="font-semibold text-foreground">Save settings</span> to generate the calendar.
                    </p>
                  </div>
                )}
                {timeline.length > 0 && (
                  <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-inner">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-muted/40">
                            <th className="border-b border-border/60 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">
                              Time
                            </th>
                            {daysInUse.map((d) => (
                              <th
                                key={d}
                                className="border-b border-border/60 px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground min-w-[8rem]"
                              >
                                {DAYS[d]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {timeline.map((block, i) => {
                            const rowH = block.durationMinutes * PX_PER_MIN;

                            if (block.type === "break") {
                              return (
                                <tr key={i}>
                                  <td
                                    className="border-b border-border/40 px-3 text-[10px] tabular-nums text-amber-700/70 dark:text-amber-400/70 align-middle"
                                    style={{ height: `${rowH}px` }}
                                  >
                                    {block.startTime}
                                  </td>

                                  <td
                                    colSpan={daysInUse.length}
                                    className="border-b border-border/40 bg-amber-50/60 dark:bg-amber-900/10 px-4 align-middle text-center"
                                    style={{ height: `${rowH}px` }}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <Coffee className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                                      <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                        Break &middot; {block.durationMinutes} min &middot; {block.startTime} – {block.endTime}
                                        {block.appliesTo === "all" ? " · All batches" : ""}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            // period row
                            return (
                              <tr key={i} className="group">
                                <td
                                  className="border-b border-border/40 px-3 align-top"
                                  style={{ height: `${rowH}px`, paddingTop: "10px" }}
                                >
                                  <div className="text-xs font-semibold text-muted-foreground">
                                    P{block.periodOrder}
                                  </div>
                                  <div className="mt-0.5 text-[10px] tabular-nums leading-tight text-muted-foreground/70">
                                    {block.startTime}
                                  </div>
                                  <div className="text-[10px] tabular-nums leading-tight text-muted-foreground/50">
                                    –{block.endTime}
                                  </div>
                                </td>
                                {daysInUse.map((d) => {
                                  const slot = getSlot(d, block.periodOrder!);
                                  return (
                                    <td
                                      key={`${d}-${block.periodOrder}`}
                                      className="border-b border-border/40 border-l border-l-border/20 px-2 py-2 align-top cursor-pointer transition-colors hover:bg-primary/5"
                                      style={{ height: `${rowH}px` }}
                                      onClick={() => openSlotDialog(d, block.periodOrder!)}
                                    >
                                      {slot ? (
                                        <div className="h-full rounded-lg border border-primary/15 bg-primary/8 px-2.5 py-2 text-xs leading-snug shadow-sm">
                                          <div className="font-semibold text-foreground">{slot.subject}</div>
                                          {slot.teacherName ? (
                                            <div className="mt-0.5 text-muted-foreground">{slot.teacherName}</div>
                                          ) : null}
                                          {slot.room ? (
                                            <div className="mt-0.5 text-[10px] text-muted-foreground/70">{slot.room}</div>
                                          ) : null}
                                        </div>
                                      ) : (
                                        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/40 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
                                          <Plus className="h-3.5 w-3.5" />
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </>
            )}
            {!selectedBatchId && (
              <p className="rounded-lg border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
                Select a batch to view and edit its timetable.
              </p>
            )}
          </CardContent>
        </Card>

          <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
            <DialogContent className="rounded-lg">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/12 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base">
                      {slotCell != null
                        ? `Period ${slotCell.periodOrder} — ${["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][slotCell.dayOfWeek]}`
                        : editingSlot ? "Edit slot" : "Add slot"}
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 text-xs">
                      {selectedBatch ? `Batch: ${selectedBatch.className}-${selectedBatch.name}` : "Choose a subject and teacher."}
                    </DialogDescription>
                  </div>
                </div>
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
                          className={cn("w-full justify-between rounded-lg font-normal", !slotForm.subject && "text-muted-foreground")}
                        >
                          {slotForm.subject || "Search and select subject..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-lg" align="start">
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
                      <SearchableSelect
                        value={slotForm.teacherUserId || "_none"}
                        onValueChange={(v) => {
                          if (v === "_none") {
                            setSlotForm((f) => ({ ...f, teacherUserId: "", teacherName: "" }));
                          } else {
                            const t = teachersForSubject.find((x) => x.id === v);
                            setSlotForm((f) => ({ ...f, teacherUserId: v, teacherName: t?.name ?? "" }));
                          }
                        }}
                        placeholder="Select teacher"
                        options={[
                          { value: "_none", label: "None" },
                          ...teachersForSubject.map((t) => ({ value: t.id, label: t.name })),
                        ]}
                      />
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
                    className="rounded-lg"
                  />
                </div>
              </div>
              <DialogFooter className="flex-row items-center justify-between sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={async () => {
                    if (!editingSlot) { setSlotDialogOpen(false); return; }
                    try {
                      await fetchApi(`/Timetable/slot/${editingSlot.id}`, { method: "DELETE" });
                      toast({ title: "Cleared", description: "Slot removed." });
                      setSlotDialogOpen(false);
                      loadSlots();
                    } catch (e: unknown) {
                      toast({ title: "Error", description: (e as Error).message || "Failed to clear slot", variant: "destructive" });
                    }
                  }}
                >
                  Clear
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" className="rounded-lg" onClick={() => setSlotDialogOpen(false)}>Cancel</Button>
                  <Button
                    className="rounded-lg"
                    onClick={handleSaveSlot}
                    disabled={subjectsForClass.length === 0 || !slotForm.subject.trim()}
                  >
                    Save
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
    </div>
  );
}
