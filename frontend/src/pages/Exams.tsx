import { useState, useEffect } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Plus, FileText, ClipboardList, CheckCircle2, XCircle, CalendarDays, Pencil, Trash2, ChevronDown, PencilLine, X } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AcademicsCardIconLead } from "@/components/AcademicsCardIconLead";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface ExamDto {
  id: string;
  name: string;
  type: string;
  classId?: string;
  className?: string;
  classIds?: string[];
  classNames?: string[];
  maxMarks?: number;
  examDate?: string;
  createdAt: string;
}

interface MarksEntryDto {
  id: string;
  examId?: string;
  studentId: string;
  studentName: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  status?: string;
  approvedAt?: string | null;
  approvedByUserId?: string | null;
  rejectionReason?: string | null;
}

interface ExamScheduleEntryDto {
  id: string;
  examId: string;
  examName?: string;
  subjectName: string;
  classId?: string;
  className?: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  createdAt: string;
}

interface ClassDto {
  id: string;
  name: string;
}

interface StudentDto {
  id: string;
  name: string;
  admissionNumber?: string;
  classId?: string;
  batchId?: string;
}

interface BatchDto {
  id: string;
  name: string;
  classId: string;
}

interface SubjectDto {
  id: string;
  name: string;
  code?: string;
}

export default function Exams() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [exams, setExams] = useState<ExamDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [marksClassFilter, setMarksClassFilter] = useState("");
  const [marksBatchFilter, setMarksBatchFilter] = useState("");
  const [marks, setMarks] = useState<MarksEntryDto[]>([]);
  const [subjectsForExamClass, setSubjectsForExamClass] = useState<SubjectDto[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: "UnitTest", classIds: [] as string[], maxMarks: "", examDate: "" });
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [showMarksPanel, setShowMarksPanel] = useState(false);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [marksForm, setMarksForm] = useState({ studentId: "", subject: "", marksObtained: "", maxMarks: "100" });
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectEntryId, setRejectEntryId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleEntries, setScheduleEntries] = useState<ExamScheduleEntryDto[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ subjectName: "", scheduledDate: "", startTime: "", endTime: "", venue: "" });

  usePageHeaderConfigEffect(
    { title: "Exams & Results", description: "Create Exams And Record Marks By Class." },
    [],
  );

  const loadExams = async () => {
    try {
      const list = (await fetchApi("/Exams")) as ExamDto[];
      setExams(list);
    } catch (_) {}
  };

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch (_) {}
  };

  const loadMarks = async () => {
    if (!selectedExamId) return;
    try {
      const list = (await fetchApi(`/Exams/${selectedExamId}/marks`)) as MarksEntryDto[];
      setMarks(list);
    } catch (_) {}
  };

  const loadSchedule = async (examId: string) => {
    try {
      const list = (await fetchApi(`/Exams/${examId}/schedule`)) as ExamScheduleEntryDto[];
      setScheduleEntries(list);
    } catch (_) { setScheduleEntries([]); }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadExams(), loadClasses()]);
      fetchApi("/Batches").then((list: unknown) => setBatches(Array.isArray(list) ? (list as BatchDto[]) : [])).catch(() => {});
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    loadMarks();
    if (selectedExamId) loadSchedule(selectedExamId);
    else setScheduleEntries([]);
  }, [selectedExamId]);

  useEffect(() => {
    if (!marksClassFilter) { setStudents([]); return; }
    let cancelled = false;
    fetchApi(`/Students?classId=${marksClassFilter}&status=Active&take=500`)
      .then((res: unknown) => {
        if (cancelled) return;
        const items = Array.isArray(res) ? (res as StudentDto[]) : ((res as { items?: StudentDto[] }).items ?? []);
        setStudents(items);
      })
      .catch(() => { if (!cancelled) setStudents([]); });
    return () => { cancelled = true; };
  }, [marksClassFilter]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const selectedExamClassId = selectedExam?.classId;
  const marksBatchesForClass = batches.filter((b) => b.classId === marksClassFilter);
  const marksFilteredStudents = students.filter((s) => !marksBatchFilter || s.batchId === marksBatchFilter);

  useEffect(() => {
    if (!selectedExamClassId) {
      setSubjectsForExamClass([]);
      return;
    }
    fetchApi(`/Subjects/for-class/${selectedExamClassId}`)
      .then((list: SubjectDto[]) => setSubjectsForExamClass(Array.isArray(list) ? list : []))
      .catch(() => setSubjectsForExamClass([]));
  }, [selectedExamClassId]);

  useEffect(() => {
    setMarksForm((f) => ({ ...f, subject: "" }));
  }, [selectedExamId]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Validation", description: "Exam name required.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/Exams", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          classIds: form.classIds.length > 0 ? form.classIds : undefined,
          maxMarks: form.maxMarks ? parseFloat(form.maxMarks) : undefined,
          examDate: form.examDate ? new Date(form.examDate).toISOString() : undefined,
        }),
      });
      toast({ title: "Success", description: "Exam created." });
      setShowCreate(false);
      setForm({ name: "", type: "UnitTest", classIds: [], maxMarks: "", examDate: "" });
      await loadExams();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleApproveAll = async () => {
    if (!selectedExamId) return;
    setApprovingAll(true);
    try {
      const res = (await fetchApi(`/Exams/${selectedExamId}/marks/approve-all`, {
        method: "POST",
      })) as { approvedCount?: number };
      toast({
        title: "Approved",
        description: `${res?.approvedCount ?? 0} pending row(s) approved.`,
      });
      await loadMarks();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    } finally {
      setApprovingAll(false);
    }
  };

  const handleApproveRow = async (entryId: string) => {
    try {
      await fetchApi(`/Exams/marks/${entryId}/approve`, { method: "POST" });
      toast({ title: "Approved", description: "Marks entry approved." });
      await loadMarks();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const openReject = (entryId: string) => {
    setRejectEntryId(entryId);
    setRejectReason("");
    setRejectOpen(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectEntryId) return;
    try {
      await fetchApi(`/Exams/marks/${rejectEntryId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
      });
      toast({ title: "Rejected", description: "Entry sent back to teacher for correction." });
      setRejectOpen(false);
      await loadMarks();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const openAddSchedule = () => {
    setEditingScheduleId(null);
    setScheduleForm({ subjectName: "", scheduledDate: "", startTime: "", endTime: "", venue: "" });
    setShowScheduleForm(true);
  };

  const openEditSchedule = (entry: ExamScheduleEntryDto) => {
    setEditingScheduleId(entry.id);
    setScheduleForm({
      subjectName: entry.subjectName,
      scheduledDate: entry.scheduledDate ? entry.scheduledDate.split("T")[0] : "",
      startTime: entry.startTime ?? "",
      endTime: entry.endTime ?? "",
      venue: entry.venue ?? "",
    });
    setShowScheduleForm(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.subjectName.trim() || !scheduleForm.scheduledDate) {
      toast({ title: "Validation", description: "Subject and date are required.", variant: "destructive" });
      return;
    }
    try {
      const body = {
        subjectName: scheduleForm.subjectName,
        scheduledDate: new Date(scheduleForm.scheduledDate).toISOString(),
        startTime: scheduleForm.startTime || undefined,
        endTime: scheduleForm.endTime || undefined,
        venue: scheduleForm.venue || undefined,
      };
      if (editingScheduleId) {
        await fetchApi(`/Exams/schedule/${editingScheduleId}`, { method: "PUT", body: JSON.stringify(body) });
        toast({ title: "Updated", description: "Schedule entry updated." });
      } else {
        await fetchApi(`/Exams/${selectedExamId}/schedule`, { method: "POST", body: JSON.stringify(body) });
        toast({ title: "Added", description: "Schedule entry added." });
      }
      setShowScheduleForm(false);
      await loadSchedule(selectedExamId);
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleDeleteSchedule = async (entryId: string) => {
    try {
      await fetchApi(`/Exams/schedule/${entryId}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Schedule entry removed." });
      await loadSchedule(selectedExamId);
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !marksForm.studentId || !marksForm.subject.trim()) {
      toast({ title: "Validation", description: "Exam, student and subject required.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/Exams/marks", {
        method: "POST",
        body: JSON.stringify({
          examId: selectedExamId,
          studentId: marksForm.studentId,
          subject: marksForm.subject,
          marksObtained: parseFloat(marksForm.marksObtained) || 0,
          maxMarks: parseFloat(marksForm.maxMarks) || 100,
        }),
      });
      toast({ title: "Success", description: "Marks saved." });
      setMarksForm({ studentId: "", subject: "", marksObtained: "", maxMarks: "100" });
      setShowMarksModal(false);
      await loadMarks();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleOpenMarks = (examId: string) => {
    setSelectedExamId(examId);
    setShowMarksPanel(true);
  };

  const handleOpenSchedule = (examId: string) => {
    setSelectedExamId(examId);
    setShowSchedulePanel(true);
  };

  const TYPE_LABEL: Record<string, string> = { UnitTest: "Unit Test", MidTerm: "Mid Term", Final: "Final" };
  const TYPE_COLOR: Record<string, string> = {
    UnitTest: "bg-blue-50 text-blue-700 border-blue-200",
    MidTerm: "bg-violet-50 text-violet-700 border-violet-200",
    Final: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const examColumns: DataTableColumn<ExamDto>[] = [
    {
      key: "name",
      header: "Exam",
      cell: (exam) => <span className="font-semibold capitalize">{exam.name}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (exam) => (
        <span className={cn("inline-block text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius)] border", TYPE_COLOR[exam.type] ?? "bg-muted text-muted-foreground border-border")}>
          {TYPE_LABEL[exam.type] ?? exam.type}
        </span>
      ),
    },
    {
      key: "classes",
      header: "Classes",
      cell: (exam) => (
        <span className="capitalize">
          {exam.classNames && exam.classNames.length > 0
            ? exam.classNames.join(", ")
            : (exam.className ?? <span className="italic opacity-60">All Classes</span>)}
        </span>
      ),
    },
    {
      key: "maxMarks",
      header: "Max Marks",
      cell: (exam) => exam.maxMarks != null ? <span className="tabular-nums">{exam.maxMarks}</span> : <span className="italic opacity-60">—</span>,
    },
    {
      key: "date",
      header: "Date",
      cell: (exam) => exam.examDate
        ? new Date(exam.examDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
        : <span className="italic opacity-60">—</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (exam) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 rounded-[var(--radius)] px-2.5 text-xs font-medium" onClick={() => handleOpenMarks(exam.id)}>
            <PencilLine className="h-3 w-3" /> Marks
          </Button>
          {isAdmin && (
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 rounded-[var(--radius)] px-2.5 text-xs font-medium" onClick={() => handleOpenSchedule(exam.id)}>
              <CalendarDays className="h-3 w-3" /> Schedule
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
              <AcademicsCardIconLead
                icon={FileText}
                title="All exams"
                description=""
              />
              <Button
                type="button"
                className="shrink-0 gap-2 rounded-lg"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="h-4 w-4" /> Create Exam
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={exams}
                columns={examColumns}
                keyExtractor={(e) => e.id}
                emptyMessage="No Exams Yet."
                emptyDescription="Create one using the button above."
              />
            </CardContent>
          </Card>
          <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) setClassPickerOpen(false); }}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Exam</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateExam} className="space-y-5">
                {/* Row 1: Name + Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Exam Name <span className="text-destructive">*</span></Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Mid Term 2025" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Exam Type</Label>
                    <SearchableSelect
                      value={form.type}
                      onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                      options={[
                        { value: "UnitTest", label: "Unit Test" },
                        { value: "MidTerm", label: "Mid Term" },
                        { value: "Final", label: "Final" },
                      ]}
                    />
                  </div>
                </div>

                {/* Row 2: Classes (multi-select) + Max Marks */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Classes <span className="text-xs text-muted-foreground font-normal">(Optional — Leave Empty For All)</span></Label>
                    <Popover open={classPickerOpen} onOpenChange={setClassPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between font-normal h-9 text-sm",
                            form.classIds.length === 0 && "text-muted-foreground"
                          )}
                        >
                          <span className="truncate">
                            {form.classIds.length === 0
                              ? "Select Classes…"
                              : classes.filter(c => form.classIds.includes(c.id)).map(c => c.name).join(", ")}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                        <div className="space-y-1 max-h-52 overflow-y-auto">
                          {classes.map((c) => (
                            <label
                              key={c.id}
                              className="flex items-center gap-2.5 cursor-pointer rounded px-2 py-1.5 text-sm hover:bg-muted/60 transition-colors"
                            >
                              <Checkbox
                                checked={form.classIds.includes(c.id)}
                                onCheckedChange={(checked) =>
                                  setForm((f) => ({
                                    ...f,
                                    classIds: checked
                                      ? [...f.classIds, c.id]
                                      : f.classIds.filter((id) => id !== c.id),
                                  }))
                                }
                              />
                              {c.name}
                            </label>
                          ))}
                          {classes.length === 0 && (
                            <p className="text-xs text-muted-foreground px-2 py-1">No classes available.</p>
                          )}
                        </div>
                        {form.classIds.length > 0 && (
                          <div className="border-t mt-2 pt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs h-7"
                              onClick={() => setForm((f) => ({ ...f, classIds: [] }))}
                            >
                              Clear Selection
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Total Marks <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.5"
                      value={form.maxMarks}
                      onChange={(e) => setForm((f) => ({ ...f, maxMarks: e.target.value }))}
                      placeholder="e.g. 100"
                    />
                    <p className="text-xs text-muted-foreground">Teachers Will Enter Marks Out Of This Total.</p>
                  </div>
                </div>

                {/* Row 3: Date (half width) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Exam Date <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                    <DatePicker value={form.examDate} onChange={(v) => setForm((f) => ({ ...f, examDate: v }))} />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button type="submit">Create Exam</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

      {/* ── Marks modal ─────────────────────────────────────────────────── */}
      {selectedExam && (
        <Dialog open={showMarksPanel} onOpenChange={(o) => { setShowMarksPanel(o); if (!o) setShowMarksModal(false); }}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 [&>button]:hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border/50 shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground capitalize">{selectedExam.name} — Marks</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedExam.classNames && selectedExam.classNames.length > 0
                    ? selectedExam.classNames.join(", ")
                    : (selectedExam.className ?? "All Classes")}
                  {selectedExam.maxMarks != null && ` · Max Marks: ${selectedExam.maxMarks}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={() => setShowMarksPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {marks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <ClipboardList className="h-9 w-9 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No Marks Recorded Yet.</p>
                  <p className="text-xs opacity-60 mt-1">Click "Add Marks" To Enter The First Entry.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Marks</TableHead>
                      <TableHead className="text-right">Max</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marks.map((m) => {
                      const st = m.status ?? "Approved";
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium capitalize">{m.studentName}</TableCell>
                          <TableCell className="capitalize">{m.subject}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">{m.marksObtained}</TableCell>
                          <TableCell className="text-right tabular-nums">{m.maxMarks}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={st === "Approved" ? "default" : st === "Rejected" ? "destructive" : "secondary"} className="w-fit text-[10px]">
                                {st}
                              </Badge>
                              {st === "Rejected" && m.rejectionReason && (
                                <span className="text-[10px] text-muted-foreground max-w-[180px] truncate">{m.rejectionReason}</span>
                              )}
                            </div>
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              {st === "Pending" && (
                                <div className="flex justify-end gap-1">
                                  <Button type="button" size="sm" variant="outline" className="h-7 gap-1 rounded-[var(--radius)]" onClick={() => void handleApproveRow(m.id)}>
                                    <CheckCircle2 className="h-3 w-3" /> Approve
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" className="h-7 gap-1 rounded-[var(--radius)]" onClick={() => openReject(m.id)}>
                                    <XCircle className="h-3 w-3" /> Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-border/50 shrink-0">
              {isAdmin && (
                <Button variant="secondary" size="sm" className="rounded-lg gap-1.5" disabled={approvingAll} onClick={handleApproveAll}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {approvingAll ? "Approving…" : "Approve All Pending"}
                </Button>
              )}
              <Button size="sm" className="rounded-lg gap-1.5" onClick={() => setShowMarksModal(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Marks
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Schedule modal ───────────────────────────────────────────────── */}
      {selectedExam && isAdmin && (
        <Dialog open={showSchedulePanel} onOpenChange={(o) => { setShowSchedulePanel(o); if (!o) setShowScheduleForm(false); }}>
          <DialogContent className="max-w-3xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 [&>button]:hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border/50 shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground capitalize">{selectedExam.name} — Schedule</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Per-Subject Exam Dates, Times And Venues</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={() => setShowSchedulePanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {scheduleEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <CalendarDays className="h-9 w-9 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No Schedule Entries Yet.</p>
                  <p className="text-xs opacity-60 mt-1">Click "Add Entry" To Set Subject Dates And Times.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduleEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-semibold capitalize">{entry.subjectName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(entry.scheduledDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{entry.startTime ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.endTime ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground capitalize">{entry.venue ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="outline" className="h-7 w-7 p-0 rounded-[var(--radius)]" onClick={() => openEditSchedule(entry)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" variant="destructive" className="h-7 w-7 p-0 rounded-[var(--radius)]" onClick={() => void handleDeleteSchedule(entry.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-border/50 shrink-0">
              <Button size="sm" className="rounded-lg gap-1.5" onClick={openAddSchedule}>
                <Plus className="h-3.5 w-3.5" /> Add Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Add marks sub-dialog ─────────────────────────────────────────── */}
      {selectedExam && (
        <Dialog open={showMarksModal} onOpenChange={(o) => { setShowMarksModal(o); if (!o) { setMarksClassFilter(""); setMarksBatchFilter(""); setStudents([]); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Marks</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveMarks} className="space-y-3">
              {/* Class + Batch — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Class</Label>
                  <SearchableSelect
                    value={marksClassFilter}
                    onValueChange={(v) => { setMarksClassFilter(v); setMarksBatchFilter(""); setMarksForm((f) => ({ ...f, studentId: "" })); }}
                    placeholder="Select Class…"
                    options={classes.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Batch <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                  <SearchableSelect
                    value={marksBatchFilter}
                    onValueChange={(v) => { setMarksBatchFilter(v); setMarksForm((f) => ({ ...f, studentId: "" })); }}
                    placeholder={
                      !marksClassFilter
                        ? "Select A Class First…"
                        : marksBatchesForClass.length === 0
                          ? "No Batches For This Class"
                          : "All Batches"
                    }
                    options={marksBatchesForClass.map((b) => ({ value: b.id, label: b.name }))}
                    disabled={!marksClassFilter || marksBatchesForClass.length === 0}
                  />
                </div>
              </div>
              {/* Student */}
              <div className="space-y-1">
                <Label>Student</Label>
                <SearchableSelect
                  value={marksForm.studentId}
                  onValueChange={(v) => setMarksForm((f) => ({ ...f, studentId: v }))}
                  placeholder={marksClassFilter ? "Select Student…" : "Select A Class First…"}
                  options={marksFilteredStudents.map((s) => ({ value: s.id, label: s.name + (s.admissionNumber ? ` (${s.admissionNumber})` : "") }))}
                  disabled={!marksClassFilter}
                />
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                {subjectsForExamClass.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No Subjects Mapped To This Exam's Class.</p>
                ) : (
                  <SearchableSelect value={marksForm.subject || ""} onValueChange={(v) => setMarksForm((f) => ({ ...f, subject: v }))} placeholder="Select subject" options={subjectsForExamClass.map((s) => ({ value: s.name, label: s.name + (s.code ? ` (${s.code})` : "") }))} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Marks</Label><Input type="number" min="0" step="0.01" value={marksForm.marksObtained} onChange={(e) => setMarksForm((f) => ({ ...f, marksObtained: e.target.value }))} placeholder="Obtained" /></div>
                <div className="space-y-1"><Label>Max</Label><Input type="number" min="1" value={marksForm.maxMarks} onChange={(e) => setMarksForm((f) => ({ ...f, maxMarks: e.target.value }))} /></div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowMarksModal(false)}>Cancel</Button>
                <Button type="submit" disabled={subjectsForExamClass.length === 0 || !marksForm.subject.trim()}>Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Reject sub-dialog ───────────────────────────────────────────── */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Marks Entry</DialogTitle>
            <DialogDescription>Optional Note For Teachers.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRejectSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Reason</Label>
              <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Totals do not match register" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive">Reject entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Schedule entry form sub-dialog ──────────────────────────────── */}
      <Dialog open={showScheduleForm} onOpenChange={setShowScheduleForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingScheduleId ? "Edit Schedule Entry" : "Add Schedule Entry"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSchedule} className="space-y-3">
            <div className="space-y-1">
              <Label>Subject</Label>
              {subjectsForExamClass.length > 0 ? (
                <SearchableSelect value={scheduleForm.subjectName} onValueChange={(v) => setScheduleForm((f) => ({ ...f, subjectName: v }))} placeholder="Select subject" options={subjectsForExamClass.map((s) => ({ value: s.name, label: s.name + (s.code ? ` (${s.code})` : "") }))} />
              ) : (
                <Input value={scheduleForm.subjectName} onChange={(e) => setScheduleForm((f) => ({ ...f, subjectName: e.target.value }))} placeholder="e.g. Mathematics" required />
              )}
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <DatePicker value={scheduleForm.scheduledDate} onChange={(v) => setScheduleForm((f) => ({ ...f, scheduledDate: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start Time</Label>
                <TimePicker value={scheduleForm.startTime} onChange={(v) => setScheduleForm((f) => ({ ...f, startTime: v }))} placeholder="Select start time" interval={15} />
              </div>
              <div className="space-y-1">
                <Label>End Time</Label>
                <TimePicker value={scheduleForm.endTime} onChange={(v) => setScheduleForm((f) => ({ ...f, endTime: v }))} placeholder="Select end time" interval={15} />
              </div>
            </div>
            <div className="space-y-1"><Label>Venue</Label><Input value={scheduleForm.venue} onChange={(e) => setScheduleForm((f) => ({ ...f, venue: e.target.value }))} placeholder="e.g. Hall A (optional)" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowScheduleForm(false)}>Cancel</Button>
              <Button type="submit">{editingScheduleId ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
