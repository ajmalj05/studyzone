import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { Plus, FileText, CheckCircle2, XCircle, CalendarDays, Pencil, Trash2, ChevronDown, PencilLine, X } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AcademicsCardIconLead } from "@/components/AcademicsCardIconLead";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = { UnitTest: "Unit Test", "Unit Test": "Unit Test", MidTerm: "Mid Term", "Mid Term": "Mid Term", Final: "Final" };
const TYPE_COLOR: Record<string, string> = {
  UnitTest: "bg-blue-50 text-blue-700 border-blue-200",
  "Unit Test": "bg-blue-50 text-blue-700 border-blue-200",
  MidTerm: "bg-violet-50 text-violet-700 border-violet-200",
  "Mid Term": "bg-violet-50 text-violet-700 border-violet-200",
  Final: "bg-rose-50 text-rose-700 border-rose-200",
};

interface ExamDto {
  id: string;
  name: string;
  type: string;
  classId?: string;
  className?: string;
  classIds?: string[];
  classNames?: string[];
  classWideClassIds?: string[];
  batchIds?: string[];
  batchNames?: string[];
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
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const isResultsModule = pathname.includes("/admin/academics/results");
  const isPublishedResultsMode = isResultsModule && new URLSearchParams(search).get("mode") === "published";
  const isMarksEntryMode = isResultsModule && !isPublishedResultsMode;
  const isExamsModule = pathname.includes("/admin/academics/exams");
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
  const [form, setForm] = useState({ name: "", type: "Unit Test", classIds: [] as string[], batchIds: [] as string[], maxMarks: "", examDate: "" });
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [batchPickerOpen, setBatchPickerOpen] = useState(false);
  const [showMarksPanel, setShowMarksPanel] = useState(false);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marksByStudentSubject, setMarksByStudentSubject] = useState<Record<string, { obtained: string; max: string }>>({});
  const [savingMarks, setSavingMarks] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectEntryId, setRejectEntryId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleEntries, setScheduleEntries] = useState<ExamScheduleEntryDto[]>([]);
  const [scheduleSubjects, setScheduleSubjects] = useState<SubjectDto[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ subjectName: "", scheduledDate: "", startTime: "", endTime: "", venue: "" });
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState("_all");
  const [scheduleClassFilter, setScheduleClassFilter] = useState("_all");
  const [marksTypeFilter, setMarksTypeFilter] = useState("_all");

  usePageHeaderConfigEffect(
    {
      title: isExamsModule ? "Exam Schedule" : isPublishedResultsMode ? "Results" : "Marks Entry",
      description: isPublishedResultsMode
        ? "View and analyze published exam results."
        : isMarksEntryMode
        ? "Enter and save student marks per exam, then submit for approval."
        : "Create exams and manage exam schedules.",
    },
    [isExamsModule, isPublishedResultsMode, isMarksEntryMode],
  );

  const loadExams = async () => {
    try {
      const list = (await fetchApi("/Exams")) as ExamDto[];
      setExams(list);
    } catch {
      setExams([]);
    }
  };

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch {
      setClasses([]);
    }
  };

  const loadMarks = async () => {
    if (!selectedExamId) return;
    try {
      const list = (await fetchApi(`/Exams/${selectedExamId}/marks`)) as MarksEntryDto[];
      const safeList = Array.isArray(list) ? list : [];
      setMarks(safeList);
      const map: Record<string, { obtained: string; max: string }> = {};
      safeList.forEach((m) => {
        map[`${m.studentId}:${m.subject}`] = { obtained: String(m.marksObtained), max: String(m.maxMarks) };
      });
      setMarksByStudentSubject(map);
    } catch {
      setMarks([]);
      setMarksByStudentSubject({});
    }
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
  const scheduleClassIds = useMemo(() => {
    if (!selectedExam) return [] as string[];
    const ids = selectedExam.classIds?.length
      ? selectedExam.classIds
      : selectedExam.classId
        ? [selectedExam.classId]
        : [];
    return Array.from(new Set(ids.filter(Boolean)));
  }, [selectedExam]);
  const createBatchOptions = batches.filter((b) => form.classIds.includes(b.classId));
  const marksClassOptions = selectedExam?.classIds?.length
    ? classes.filter((c) => selectedExam.classIds?.includes(c.id))
    : classes;
  const selectedClassIsClassWide = !selectedExam?.classIds?.length || selectedExam.classWideClassIds?.includes(marksClassFilter);
  const selectedExamBatchIdsForClass = selectedClassIsClassWide
    ? []
    : (selectedExam?.batchIds ?? []).filter((batchId) => batches.find((b) => b.id === batchId)?.classId === marksClassFilter);
  const marksBatchesForClass = batches.filter((b) =>
    b.classId === marksClassFilter &&
    (selectedClassIsClassWide || selectedExamBatchIdsForClass.includes(b.id))
  );
  const marksFilteredStudents = students.filter((s) => {
    if (!selectedClassIsClassWide && (!s.batchId || !selectedExamBatchIdsForClass.includes(s.batchId))) return false;
    return !marksBatchFilter || s.batchId === marksBatchFilter;
  });
  const adminMaxMarks = selectedExam?.maxMarks != null ? String(selectedExam.maxMarks) : "100";
  const filledMarksCount = selectedSubject
    ? marksFilteredStudents.filter((s) => {
        const v = marksByStudentSubject[`${s.id}:${selectedSubject}`];
        return v?.obtained && v.obtained !== "";
      }).length
    : 0;
  const selectedClassName = classes.find((c) => c.id === marksClassFilter)?.name;

  useEffect(() => {
    if (!marksClassFilter) {
      setSubjectsForExamClass([]);
      setSelectedSubject("");
      return;
    }
    fetchApi(`/Subjects/for-class/${marksClassFilter}`)
      .then((list: SubjectDto[]) => {
        const safeList = Array.isArray(list) ? list : [];
        setSubjectsForExamClass(safeList);
        setSelectedSubject((prev) => safeList.some((s) => s.name === prev) ? prev : (safeList[0]?.name ?? ""));
      })
      .catch(() => {
        setSubjectsForExamClass([]);
        setSelectedSubject("");
      });
  }, [marksClassFilter]);

  useEffect(() => {
    if (!isMarksEntryMode) return;
    if (selectedExamId || exams.length === 0) return;
    const exam = exams[0];
    const defaultClassId = exam.classIds?.[0] || exam.classId || "";
    const defaultClassIsWide = !exam.classIds?.length || exam.classWideClassIds?.includes(defaultClassId);
    const defaultBatchId = defaultClassIsWide ? "" : (exam.batchIds?.find((batchId) => batches.find((b) => b.id === batchId)?.classId === defaultClassId) || "");
    setSelectedExamId(exam.id);
    setMarksClassFilter(defaultClassId);
    setMarksBatchFilter(defaultBatchId);
    setSelectedSubject("");
  }, [isMarksEntryMode, selectedExamId, exams, batches]);

  useEffect(() => {
    if (!selectedExamId) {
      setScheduleSubjects([]);
      return;
    }
    if (scheduleClassIds.length === 0) {
      fetchApi("/Subjects")
        .then((list: SubjectDto[]) => {
          const safeList = Array.isArray(list) ? list : [];
          setScheduleSubjects(safeList);
        })
        .catch(() => setScheduleSubjects([]));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const all = await Promise.all(
          scheduleClassIds.map((classId) =>
            fetchApi(`/Subjects/for-class/${classId}`).catch(() => [] as SubjectDto[])
          )
        );
        if (cancelled) return;
        const map = new Map<string, SubjectDto>();
        all.flat().forEach((s) => {
          const key = (s.id || s.name || "").toLowerCase();
          if (!key || map.has(key)) return;
          map.set(key, s);
        });
        setScheduleSubjects(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        if (!cancelled) setScheduleSubjects([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedExamId, scheduleClassIds]);

  const getGrade = (marksValue: number) => {
    if (marksValue >= 90) return "A+";
    if (marksValue >= 80) return "A";
    if (marksValue >= 70) return "B+";
    if (marksValue >= 60) return "B";
    if (marksValue >= 50) return "C";
    return "F";
  };

  const setMark = (studentId: string, obtained: string) => {
    setMarksByStudentSubject((prev) => ({
      ...prev,
      [`${studentId}:${selectedSubject}`]: { obtained, max: adminMaxMarks },
    }));
  };

  const getCellDisplay = (studentId: string, subjectName: string) => {
    const val = marksByStudentSubject[`${studentId}:${subjectName}`];
    if (val?.obtained) return `${val.obtained}/${val.max || adminMaxMarks} (${getGrade(parseFloat(val.obtained) || 0)})`;
    const row = marks.find((m) => m.studentId === studentId && m.subject === subjectName);
    if (row) return `${row.marksObtained}/${row.maxMarks}`;
    return "—";
  };

  const overviewSubjects = useMemo(() => {
    const names = new Set<string>();
    subjectsForExamClass.forEach((s) => names.add(s.name));
    marks.forEach((m) => names.add(m.subject));
    return Array.from(names).sort();
  }, [subjectsForExamClass, marks]);

  const filteredMarksExams = useMemo(
    () =>
      exams.filter((e) => marksTypeFilter === "_all" || (TYPE_LABEL[e.type] ?? e.type).trim() === marksTypeFilter),
    [exams, marksTypeFilter],
  );

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Validation", description: "Exam name required.", variant: "destructive" });
      return;
    }
    if (!form.type.trim()) {
      toast({ title: "Validation", description: "Exam type required.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/Exams", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type.trim(),
          classIds: form.classIds.length > 0 ? form.classIds : undefined,
          batchIds: form.batchIds.length > 0 ? form.batchIds : undefined,
          maxMarks: form.maxMarks ? parseFloat(form.maxMarks) : undefined,
          examDate: form.examDate ? new Date(form.examDate).toISOString() : undefined,
        }),
      });
      toast({ title: "Success", description: "Exam created." });
      setShowCreate(false);
      setForm({ name: "", type: "Unit Test", classIds: [], batchIds: [], maxMarks: "", examDate: "" });
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
    setScheduleForm({
      subjectName: scheduleSubjects[0]?.name ?? "",
      scheduledDate: "",
      startTime: "",
      endTime: "",
      venue: "",
    });
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

  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedSubject.trim()) {
      toast({ title: "Validation", description: "Select an exam and subject.", variant: "destructive" });
      return;
    }
    setSavingMarks(true);
    let saved = 0;
    let failed = 0;
    for (const student of marksFilteredStudents) {
      const val = marksByStudentSubject[`${student.id}:${selectedSubject}`];
      if (!val || val.obtained === "") continue;
      try {
        await fetchApi("/Exams/marks", {
          method: "POST",
          body: JSON.stringify({
            examId: selectedExamId,
            studentId: student.id,
            subject: selectedSubject,
            marksObtained: parseFloat(val.obtained) || 0,
            maxMarks: parseFloat(val.max) || parseFloat(adminMaxMarks) || 100,
          }),
        });
        saved++;
      } catch {
        failed++;
      }
    }
    setSavingMarks(false);
    if (saved > 0) {
      toast({ title: "Success", description: `Marks saved for ${saved} student(s).` });
      await loadMarks();
    }
    if (failed > 0) {
      toast({ title: "Error", description: `${failed} save(s) failed.`, variant: "destructive" });
    }
  };

  const handleOpenMarks = (examId: string) => {
    if (!isMarksEntryMode) return;
    const exam = exams.find((e) => e.id === examId);
    const defaultClassId = exam?.classIds?.[0] || exam?.classId || "";
    const defaultClassIsWide = !exam?.classIds?.length || exam.classWideClassIds?.includes(defaultClassId);
    const defaultBatchId = defaultClassIsWide ? "" : (exam?.batchIds?.find((batchId) => batches.find((b) => b.id === batchId)?.classId === defaultClassId) || "");
    setSelectedExamId(examId);
    setMarksClassFilter(defaultClassId);
    setMarksBatchFilter(defaultBatchId);
    setSelectedSubject("");
    setShowMarksPanel(true);
  };

  const handleSelectMarksExamInline = (examId: string) => {
    if (!isMarksEntryMode) return;
    const exam = exams.find((e) => e.id === examId);
    const defaultClassId = exam?.classIds?.[0] || exam?.classId || "";
    const defaultClassIsWide = !exam?.classIds?.length || exam.classWideClassIds?.includes(defaultClassId);
    const defaultBatchId = defaultClassIsWide ? "" : (exam?.batchIds?.find((batchId) => batches.find((b) => b.id === batchId)?.classId === defaultClassId) || "");
    setSelectedExamId(examId);
    setMarksClassFilter(defaultClassId);
    setMarksBatchFilter(defaultBatchId);
    setSelectedSubject("");
  };

  const handleOpenSchedule = (examId: string) => {
    if (!isExamsModule) return;
    setSelectedExamId(examId);
    setShowSchedulePanel(true);
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
      header: "Scope",
      cell: (exam) => (
        <div className="space-y-0.5">
          <div className="capitalize">
            {exam.classNames && exam.classNames.length > 0
              ? exam.classNames.join(", ")
              : (exam.className ?? <span className="italic opacity-60">All Classes</span>)}
          </div>
          {exam.batchNames?.length ? (
            <div className="text-xs text-muted-foreground">Batches: {exam.batchNames.join(", ")}</div>
          ) : null}
        </div>
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
          {isMarksEntryMode && (
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 rounded-[var(--radius)] px-2.5 text-xs font-medium" onClick={() => handleOpenMarks(exam.id)}>
              <PencilLine className="h-3 w-3" /> Marks
            </Button>
          )}
          {isExamsModule && isAdmin && (
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 rounded-[var(--radius)] px-2.5 text-xs font-medium" onClick={() => handleOpenSchedule(exam.id)}>
              <CalendarDays className="h-3 w-3" /> Schedule
            </Button>
          )}
        </div>
      ),
    },
  ];

  const totalExams = exams.length;
  const totalSchedules = exams.filter((e) => !!e.examDate).length;
  const totalMarksRows = marks.length;
  const pendingMarksRows = marks.filter((m) => (m.status ?? "Pending") === "Pending").length;
  const scheduleTypeOptions = useMemo(
    () => ["_all", ...Array.from(new Set(exams.map((e) => (TYPE_LABEL[e.type] ?? e.type).trim()))).filter(Boolean)],
    [exams],
  );
  const filteredScheduleExams = useMemo(() => {
    return exams.filter((e) => {
      const examType = (TYPE_LABEL[e.type] ?? e.type).trim();
      const classMatch =
        scheduleClassFilter === "_all" ||
        e.classId === scheduleClassFilter ||
        e.classIds?.includes(scheduleClassFilter) ||
        e.classWideClassIds?.includes(scheduleClassFilter);
      const typeMatch = scheduleTypeFilter === "_all" || examType === scheduleTypeFilter;
      return classMatch && typeMatch;
    });
  }, [exams, scheduleClassFilter, scheduleTypeFilter]);
  const upcomingScheduleExams = useMemo(
    () =>
      exams
        .filter((e) => !!e.examDate)
        .sort((a, b) => new Date(a.examDate as string).getTime() - new Date(b.examDate as string).getTime())
        .slice(0, 4),
    [exams],
  );
  const typeDistribution = useMemo(() => {
    const map = new Map<string, number>();
    exams.forEach((e) => {
      const k = (TYPE_LABEL[e.type] ?? e.type).trim() || "Other";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [exams]);

  const resolveExamStatus = (exam: ExamDto) => {
    if (!exam.examDate) {
      return { label: "Not Scheduled", className: "bg-slate-100 text-slate-600" };
    }
    const examDate = new Date(exam.examDate);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfExamDay = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());
    if (startOfExamDay > startOfToday) {
      return { label: "Upcoming", className: "bg-amber-100 text-amber-700" };
    }
    return { label: "Scheduled", className: "bg-emerald-100 text-emerald-700" };
  };

  const marksTypeOptions = useMemo(
    () => ["_all", ...Array.from(new Set(exams.map((e) => (TYPE_LABEL[e.type] ?? e.type).trim()))).filter(Boolean)],
    [exams],
  );
  const createExamTypeOptions = useMemo(() => {
    const defaults = ["Unit Test", "Mid Term", "Final", "Practical", "Weekly Test", "Monthly Test", "Model Exam"];
    const fromData = exams.map((e) => (TYPE_LABEL[e.type] ?? e.type).trim()).filter(Boolean);
    return Array.from(new Set([...defaults, ...fromData]));
  }, [exams]);

  const exportMarksCsv = () => {
    const rows = marks.map((m) => [m.studentName, m.subject, String(m.marksObtained), String(m.maxMarks), m.status ?? "Pending"]);
    const csv = [["Student", "Subject", "Marks", "Max", "Status"], ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedExam?.name ?? "marks"}-log.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Total Exams</p><p className="mt-1 text-2xl font-extrabold text-teal-700">{totalExams}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">{isExamsModule ? "Scheduled" : isPublishedResultsMode ? "Published" : "Marks Rows"}</p><p className="mt-1 text-2xl font-extrabold text-blue-600">{isExamsModule ? totalSchedules : isPublishedResultsMode ? marks.filter((m) => m.status === "Approved").length : totalMarksRows}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">{isExamsModule ? "Upcoming" : isPublishedResultsMode ? "Pending Approval" : "Pending Approval"}</p><p className="mt-1 text-2xl font-extrabold text-amber-600">{isExamsModule ? exams.filter((e) => !!e.examDate && new Date(e.examDate) >= new Date()).length : pendingMarksRows}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Mode</p><p className="mt-1 text-base font-extrabold text-emerald-600">{isExamsModule ? "Exam Schedule" : isPublishedResultsMode ? "Published Results" : "Marks Entry"}</p></CardContent></Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
              <AcademicsCardIconLead
                icon={FileText}
                title={isExamsModule ? "Exam Schedule" : isPublishedResultsMode ? "Results Explorer" : "Marks Entry"}
                description={isExamsModule ? "Create exams and manage exam timetable." : isPublishedResultsMode ? "Filter and view published results by exam, class, batch and subject." : "Enter and save student marks per exam, then submit for approval."}
              />
              {isExamsModule && (
                <Button
                  type="button"
                  className="shrink-0 gap-2 rounded-lg"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="h-4 w-4" /> Create Exam
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isPublishedResultsMode ? (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-5">
                    <SearchableSelect value={selectedExamId || "_all"} onValueChange={(v) => setSelectedExamId(v === "_all" ? "" : v)} placeholder="All exams" options={[{ value: "_all", label: "All Exams" }, ...exams.map((e) => ({ value: e.id, label: e.name }))]} />
                    <SearchableSelect value={marksClassFilter || "_all"} onValueChange={(v) => { setMarksClassFilter(v === "_all" ? "" : v); setMarksBatchFilter(""); }} placeholder="All classes" options={[{ value: "_all", label: "All Classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
                    <SearchableSelect value={marksBatchFilter || "_all"} onValueChange={(v) => setMarksBatchFilter(v === "_all" ? "" : v)} placeholder="All batches" options={[{ value: "_all", label: "All Batches" }, ...batches.filter((b) => !marksClassFilter || b.classId === marksClassFilter).map((b) => ({ value: b.id, label: b.name }))]} />
                    <SearchableSelect value={selectedSubject || "_all"} onValueChange={(v) => setSelectedSubject(v === "_all" ? "" : v)} placeholder="All subjects" options={[{ value: "_all", label: "All Subjects" }, ...Array.from(new Set(marks.map((m) => m.subject))).map((s) => ({ value: s, label: s }))]} />
                    <SearchableSelect value={"_approved"} onValueChange={() => {}} placeholder="Status" options={[{ value: "_approved", label: "Approved" }]} disabled />
                  </div>
                  <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Student</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Subject</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Marks</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marks
                          .filter((m) => (m.status ?? "") === "Approved")
                          .filter((m) => !selectedSubject || m.subject === selectedSubject)
                          .map((m) => (
                            <tr key={m.id} className="border-b border-slate-200/80 last:border-0 hover:bg-slate-50">
                              <td className="px-4 py-3">{m.studentName}</td>
                              <td className="px-4 py-3">{m.subject}</td>
                              <td className="px-4 py-3">{m.marksObtained}/{m.maxMarks}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Approved</span>
                              </td>
                            </tr>
                          ))}
                        {marks.filter((m) => (m.status ?? "") === "Approved").filter((m) => !selectedSubject || m.subject === selectedSubject).length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                              No published results match the selected filters. Approve submissions in Approvals first.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : isExamsModule ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-[180px] max-w-[220px]">
                        <SearchableSelect
                          value={scheduleTypeFilter}
                          onValueChange={setScheduleTypeFilter}
                          placeholder="Filter exam type"
                          options={scheduleTypeOptions.map((opt) => ({
                            value: opt,
                            label: opt === "_all" ? "All" : opt,
                          }))}
                        />
                      </div>
                      <div className="ml-auto min-w-[170px] max-w-[220px] flex-1">
                        <SearchableSelect
                          value={scheduleClassFilter}
                          onValueChange={setScheduleClassFilter}
                          placeholder="All classes"
                          options={[
                            { value: "_all", label: "All Classes" },
                            ...classes.map((c) => ({ value: c.id, label: c.name })),
                          ]}
                        />
                      </div>
                      {isAdmin && (
                        <Button type="button" className="h-8 gap-1.5 rounded-md px-3 text-xs" onClick={() => setShowCreate(true)}>
                          <Plus className="h-3.5 w-3.5" /> Schedule Exam
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredScheduleExams.map((exam) => (
                        <div key={exam.id} className="rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{exam.name}</p>
                              <p className="text-xs text-slate-500">{exam.className ?? exam.classNames?.join(", ") ?? "All classes"}</p>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold">
                              {TYPE_LABEL[exam.type] ?? exam.type}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                              <div className="font-semibold text-slate-800">{exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "Date N/A"}</div>
                              <div className="text-slate-500">DATE</div>
                            </div>
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                              <div className="font-semibold text-slate-800">{exam.examDate ? new Date(exam.examDate).toLocaleDateString(undefined, { weekday: "long" }) : "Day N/A"}</div>
                              <div className="text-slate-500">DAY</div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", resolveExamStatus(exam).className)}>
                              {resolveExamStatus(exam).label}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Button type="button" size="sm" className="h-7 rounded-md px-2.5 text-xs" onClick={() => handleOpenSchedule(exam.id)}>
                                Manage
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-md px-2.5 text-xs"
                                onClick={() => {
                                  if (isMarksEntryMode) {
                                    handleOpenMarks(exam.id);
                                    return;
                                  }
                                  navigate("/admin/academics/results");
                                }}
                              >
                                Marks
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredScheduleExams.length === 0 && (
                        <div className="col-span-full rounded-[14px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                          No scheduled exams match the selected filters.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-sm font-bold text-slate-900">By Type</p>
                      <p className="mb-2 text-xs text-slate-500">Exam distribution</p>
                      <div className="space-y-2">
                        {typeDistribution.map(([type, count]) => {
                          const max = Math.max(...typeDistribution.map((x) => x[1]), 1);
                          const width = Math.max(8, Math.round((count / max) * 100));
                          return (
                            <div key={type} className="grid grid-cols-[70px_1fr_18px] items-center gap-2 text-xs">
                              <span>{type}</span>
                              <div className="h-1.5 rounded-full bg-slate-100">
                                <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${width}%` }} />
                              </div>
                              <span className="text-right text-slate-500">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-sm font-bold text-slate-900">Upcoming</p>
                      <p className="mb-2 text-xs text-slate-500">Next scheduled exams</p>
                      <div className="space-y-2">
                        {upcomingScheduleExams.map((exam) => (
                          <div key={exam.id} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs">
                            <p className="font-semibold text-slate-800">{exam.name}</p>
                            <p className="text-slate-500">
                              {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "No date"} · {exam.className ?? exam.classNames?.[0] ?? "All classes"}
                            </p>
                          </div>
                        ))}
                        {upcomingScheduleExams.length === 0 && <p className="text-xs text-slate-500">No upcoming exams</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-[190px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">Select Exam</p>
                    <div className="max-w-[190px]">
                      <SearchableSelect
                        value={marksTypeFilter}
                        onValueChange={setMarksTypeFilter}
                        placeholder="Filter exam type"
                        options={marksTypeOptions.map((opt) => ({
                          value: opt,
                          label: opt === "_all" ? "All" : opt,
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      {filteredMarksExams.map((exam) => (
                        <button
                          key={exam.id}
                          type="button"
                          onClick={() => handleSelectMarksExamInline(exam.id)}
                          className={cn(
                            "w-full rounded-xl border p-2.5 text-left transition-colors",
                            selectedExamId === exam.id
                              ? "border-teal-500 bg-teal-50/40"
                              : "border-slate-200 bg-white hover:bg-slate-50",
                          )}
                        >
                          <p className="text-sm font-semibold text-slate-900">{exam.name}</p>
                          <p className="text-xs text-slate-500">{exam.className ?? "All Classes"} · {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "No date"}</p>
                          <div className="mt-2 flex items-center gap-1">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{TYPE_LABEL[exam.type] ?? exam.type}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{marks.filter((m) => m.examId === exam.id).length || "No"} marks</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{selectedExam?.name ?? "Select exam"}</span>
                        {selectedExam && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">{TYPE_LABEL[selectedExam.type] ?? selectedExam.type}</span>}
                        {selectedExam && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">{selectedExam.className ?? "All Classes"}</span>}
                      </div>
                      <Button type="button" size="sm" variant="outline" className="h-7 rounded-md px-2 text-xs" onClick={exportMarksCsv}>
                        Export
                      </Button>
                    </div>

                    <div className="border-b border-slate-200 px-3 py-2 text-xs text-slate-600">
                      <div className="flex items-center gap-6">
                        <span className="font-semibold text-slate-900">1 Class</span>
                        <span>2 Batch</span>
                        <span>3 Subject</span>
                        <span>4 Enter Marks</span>
                      </div>
                    </div>

                    <div className="border-b border-slate-200 px-3 py-3">
                      <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_90px_auto]">
                        <div>
                          <Label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Class *</Label>
                          <SearchableSelect
                            value={marksClassFilter}
                            onValueChange={(v) => {
                              setMarksClassFilter(v);
                              setMarksBatchFilter("");
                            }}
                            placeholder="-- Class --"
                            options={marksClassOptions.map((c) => ({ value: c.id, label: c.name }))}
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Batch *</Label>
                          <SearchableSelect
                            value={marksBatchFilter || "_all"}
                            onValueChange={(v) => setMarksBatchFilter(v === "_all" ? "" : v)}
                            placeholder="-- Batch --"
                            options={[
                              { value: "_all", label: "-- Batch --" },
                              ...marksBatchesForClass.map((b) => ({ value: b.id, label: b.name })),
                            ]}
                            disabled={!marksClassFilter}
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Subject *</Label>
                          <SearchableSelect
                            value={selectedSubject}
                            onValueChange={setSelectedSubject}
                            placeholder="-- Subject --"
                            options={subjectsForExamClass.map((s) => ({ value: s.name, label: s.name + (s.code ? ` (${s.code})` : "") }))}
                            disabled={!marksClassFilter}
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Max Marks</Label>
                          <Input value={adminMaxMarks} readOnly className="h-9" />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" className="h-9 rounded-md px-3 text-xs" disabled={!marksClassFilter || !selectedSubject}>
                            Load Students
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-[260px] overflow-auto px-3 py-3">
                      {!marksClassFilter || !selectedSubject ? (
                        <div className="flex h-[140px] items-center justify-center text-center">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Select class, batch and subject</p>
                            <p className="text-xs text-slate-500">All students in that batch will load for marks entry</p>
                          </div>
                        </div>
                      ) : marksFilteredStudents.length === 0 ? (
                        <p className="py-12 text-center text-sm text-slate-500">No active students found for this selection.</p>
                      ) : (
                        <div className="space-y-2">
                          {marksFilteredStudents.map((student) => {
                            const val = marksByStudentSubject[`${student.id}:${selectedSubject}`] ?? { obtained: "", max: adminMaxMarks };
                            return (
                              <div key={student.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                                  <p className="text-[10px] text-slate-500">{student.admissionNumber ?? "—"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={val.obtained}
                                    onChange={(e) => setMark(student.id, e.target.value)}
                                    className="h-8 w-20 text-center"
                                    min={0}
                                    max={parseFloat(adminMaxMarks) || 999}
                                  />
                                  <span className="text-xs text-slate-500">/ {adminMaxMarks}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-200 px-3 py-2.5">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700">Saved Marks Log</p>
                        <div className="flex items-center gap-2">
                          <SearchableSelect value={marksClassFilter || "_all"} onValueChange={(v) => setMarksClassFilter(v === "_all" ? "" : v)} placeholder="All classes" options={[{ value: "_all", label: "All classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} className="w-[140px]" />
                          <SearchableSelect value={selectedSubject || "_all"} onValueChange={(v) => setSelectedSubject(v === "_all" ? "" : v)} placeholder="All subjects" options={[{ value: "_all", label: "All subjects" }, ...Array.from(new Set(marks.map((m) => m.subject))).map((s) => ({ value: s, label: s }))]} className="w-[140px]" />
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="px-2 py-2 text-left text-[10px] uppercase tracking-[0.6px] text-slate-500">Student</th>
                              <th className="px-2 py-2 text-left text-[10px] uppercase tracking-[0.6px] text-slate-500">Subject</th>
                              <th className="px-2 py-2 text-left text-[10px] uppercase tracking-[0.6px] text-slate-500">Marks</th>
                              <th className="px-2 py-2 text-left text-[10px] uppercase tracking-[0.6px] text-slate-500">Status</th>
                              <th className="px-2 py-2 text-right text-[10px] uppercase tracking-[0.6px] text-slate-500">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {marks.map((m) => (
                              <tr key={m.id} className="border-t border-slate-200">
                                <td className="px-2 py-2">{m.studentName}</td>
                                <td className="px-2 py-2">{m.subject}</td>
                                <td className="px-2 py-2">{m.marksObtained}/{m.maxMarks}</td>
                                <td className="px-2 py-2">{m.status ?? "Pending"}</td>
                                <td className="px-2 py-2">
                                  <div className="flex justify-end gap-1">
                                    {(m.status ?? "Pending") === "Pending" && (
                                      <>
                                        <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => handleApproveRow(m.id)}>Approve</Button>
                                        <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[10px] text-red-600" onClick={() => openReject(m.id)}>Reject</Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {marks.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-2 py-8 text-center text-xs text-slate-500">No marks logged yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 flex justify-end gap-2">
                        {isAdmin && (
                          <Button variant="secondary" size="sm" className="rounded-md text-xs" disabled={approvingAll || !selectedExamId} onClick={handleApproveAll}>
                            {approvingAll ? "Approving..." : "Approve All Pending"}
                          </Button>
                        )}
                        <Button size="sm" className="rounded-md text-xs" onClick={handleSaveMarks} disabled={savingMarks || !selectedSubject || marksFilteredStudents.length === 0}>
                          {savingMarks ? "Saving..." : "Save Marks"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Dialog open={isExamsModule && showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) { setClassPickerOpen(false); setBatchPickerOpen(false); } }}>
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
                    <Label>Exam Type <span className="text-destructive">*</span></Label>
                    <SearchableSelect
                      value={form.type}
                      onValueChange={(value) => setForm((f) => ({ ...f, type: value }))}
                      placeholder="Select exam type"
                      options={createExamTypeOptions.map((t) => ({ value: t, label: t }))}
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
                                  setForm((f) => {
                                    const classIds = checked
                                      ? [...f.classIds, c.id]
                                      : f.classIds.filter((id) => id !== c.id);
                                    const allowedBatchIds = new Set(batches.filter((b) => classIds.includes(b.classId)).map((b) => b.id));
                                    return {
                                      ...f,
                                      classIds,
                                      batchIds: f.batchIds.filter((id) => allowedBatchIds.has(id)),
                                    };
                                  })
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
                              onClick={() => setForm((f) => ({ ...f, classIds: [], batchIds: [] }))}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Batches <span className="text-xs text-muted-foreground font-normal">(Optional — Class Wide If Empty)</span></Label>
                    <Popover open={batchPickerOpen} onOpenChange={setBatchPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          disabled={form.classIds.length === 0}
                          className={cn(
                            "w-full justify-between font-normal h-9 text-sm",
                            form.batchIds.length === 0 && "text-muted-foreground"
                          )}
                        >
                          <span className="truncate">
                            {form.classIds.length === 0
                              ? "Select classes first"
                              : form.batchIds.length === 0
                                ? "All batches in selected classes"
                                : createBatchOptions.filter((b) => form.batchIds.includes(b.id)).map((b) => b.name).join(", ")}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                        <div className="space-y-1 max-h-52 overflow-y-auto">
                          {createBatchOptions.map((b) => (
                            <label
                              key={b.id}
                              className="flex items-center gap-2.5 cursor-pointer rounded px-2 py-1.5 text-sm hover:bg-muted/60 transition-colors"
                            >
                              <Checkbox
                                checked={form.batchIds.includes(b.id)}
                                onCheckedChange={(checked) =>
                                  setForm((f) => ({
                                    ...f,
                                    batchIds: checked
                                      ? [...f.batchIds, b.id]
                                      : f.batchIds.filter((id) => id !== b.id),
                                  }))
                                }
                              />
                              <span>{classes.find((c) => c.id === b.classId)?.name} - {b.name}</span>
                            </label>
                          ))}
                          {createBatchOptions.length === 0 && (
                            <p className="text-xs text-muted-foreground px-2 py-1">No batches available for selected classes.</p>
                          )}
                        </div>
                        {form.batchIds.length > 0 && (
                          <div className="border-t mt-2 pt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs h-7"
                              onClick={() => setForm((f) => ({ ...f, batchIds: [] }))}
                            >
                              Clear Batch Selection
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">Pick batches only when this exam is not for the whole class.</p>
                  </div>
                </div>

                {/* Row 4: Date (half width) */}
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
      {selectedExam && isMarksEntryMode && (
        <Dialog open={showMarksPanel} onOpenChange={setShowMarksPanel}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 [&>button]:hidden">
            <DialogTitle className="sr-only">{selectedExam.name} marks</DialogTitle>
            <DialogDescription className="sr-only">
              View existing marks, select a class, batch, and subject, then enter marks for students.
            </DialogDescription>
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border/50 shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground capitalize">{selectedExam.name} — Marks</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedExam.classNames && selectedExam.classNames.length > 0
                    ? selectedExam.classNames.join(", ")
                    : (selectedExam.className ?? "All Classes")}
                  {selectedExam.batchNames?.length ? ` · Batches: ${selectedExam.batchNames.join(", ")}` : ""}
                  {selectedExam.maxMarks != null && ` · Max Marks: ${selectedExam.maxMarks}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={() => setShowMarksPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 space-y-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Class</Label>
                  <SearchableSelect
                    value={marksClassFilter}
                    onValueChange={(v) => {
                      setMarksClassFilter(v);
                      setMarksBatchFilter("");
                    }}
                    placeholder="Select class"
                    options={marksClassOptions.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Batch</Label>
                  <SearchableSelect
                    value={marksBatchFilter || "_all"}
                    onValueChange={(v) => setMarksBatchFilter(v === "_all" ? "" : v)}
                    placeholder="All batches"
                    options={[
                      { value: "_all", label: "All batches" },
                      ...marksBatchesForClass.map((b) => ({ value: b.id, label: b.name })),
                    ]}
                    disabled={!marksClassFilter || marksBatchesForClass.length === 0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</Label>
                  <SearchableSelect
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    placeholder="Select subject"
                    options={subjectsForExamClass.map((s) => ({ value: s.name, label: s.name + (s.code ? ` (${s.code})` : "") }))}
                    disabled={!marksClassFilter || subjectsForExamClass.length === 0}
                  />
                </div>
              </div>

              {marksClassFilter && overviewSubjects.length > 0 && marksFilteredStudents.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="sticky left-0 z-[1] bg-muted/40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student</th>
                        {overviewSubjects.map((subject) => (
                          <th key={subject} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                            {subject}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {marksFilteredStudents.map((student, index) => (
                        <tr key={student.id} className={cn("border-b border-border/40 transition-colors hover:bg-muted/20", index % 2 !== 0 && "bg-muted/10")}>
                          <td className="sticky left-0 z-[1] bg-background px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <span className="text-sm font-medium">{student.name}</span>
                                {student.admissionNumber && <span className="block text-[10px] text-muted-foreground">{student.admissionNumber}</span>}
                              </div>
                            </div>
                          </td>
                          {overviewSubjects.map((subject) => (
                            <td key={subject} className="px-3 py-3 text-center text-xs font-medium tabular-nums">
                              {getCellDisplay(student.id, subject)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!marksClassFilter ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Select a class to enter marks.</p>
              ) : subjectsForExamClass.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No subjects mapped to this class.</p>
              ) : marksFilteredStudents.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No active students found for this selection.</p>
              ) : selectedSubject ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {filledMarksCount} / {marksFilteredStudents.length} filled for {selectedSubject}
                    </p>
                    {selectedClassName && <p className="text-xs text-muted-foreground">{selectedClassName}</p>}
                  </div>
                  {marksFilteredStudents.map((student, index) => {
                    const val = marksByStudentSubject[`${student.id}:${selectedSubject}`] ?? { obtained: "", max: adminMaxMarks };
                    const num = parseFloat(val.obtained || "0");
                    const maxNum = parseFloat(adminMaxMarks || "100");
                    const pct = val.obtained && maxNum > 0 ? Math.round((num / maxNum) * 100) : null;
                    const grade = val.obtained ? getGrade(num) : "—";
                    const rowMark = marks.find((m) => m.studentId === student.id && m.subject === selectedSubject);
                    const approvalStatus = rowMark?.status;
                    return (
                      <div
                        key={student.id}
                        className={cn(
                          "flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 transition-colors hover:bg-muted/20",
                          index % 2 !== 0 && "bg-muted/10",
                        )}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                          {student.admissionNumber?.slice(-2) ?? student.name.charAt(0)}
                        </div>
                        <div className="min-w-[140px] flex-1">
                          <p className="text-sm font-semibold text-foreground">{student.name}</p>
                          {student.admissionNumber && <p className="text-[10px] text-muted-foreground">{student.admissionNumber}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Marks"
                            value={val.obtained}
                            onChange={(e) => setMark(student.id, e.target.value)}
                            className="h-9 w-24 rounded-xl text-center"
                            min={0}
                            max={parseFloat(adminMaxMarks) || 999}
                          />
                          <span className="text-sm text-muted-foreground">/ {adminMaxMarks}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("w-8 text-center text-sm font-bold", grade === "F" ? "text-destructive" : grade === "A+" ? "text-emerald-600" : "text-primary")}>
                            {grade}
                          </span>
                          {pct !== null && <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>}
                        </div>
                        {approvalStatus && (
                          <div className="flex flex-col items-end gap-0.5">
                            <Badge variant={approvalStatus === "Approved" ? "default" : approvalStatus === "Rejected" ? "destructive" : "secondary"} className="px-1.5 py-0 text-[10px]">
                              {approvalStatus}
                            </Badge>
                            {approvalStatus === "Rejected" && rowMark?.rejectionReason && (
                              <span className="max-w-[120px] truncate text-[10px] text-muted-foreground" title={rowMark.rejectionReason}>{rowMark.rejectionReason}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">Select a subject to enter marks.</p>
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
              <Button
                size="sm"
                className="rounded-lg gap-1.5"
                onClick={handleSaveMarks}
                disabled={savingMarks || !selectedSubject || marksFilteredStudents.length === 0}
              >
                {savingMarks ? "Saving…" : "Save Marks"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Schedule modal ───────────────────────────────────────────────── */}
      {selectedExam && isExamsModule && isAdmin && (
        <Dialog open={showSchedulePanel} onOpenChange={(o) => { setShowSchedulePanel(o); if (!o) setShowScheduleForm(false); }}>
          <DialogContent className="max-w-3xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 [&>button]:hidden">
            <DialogTitle className="sr-only">{selectedExam.name} schedule</DialogTitle>
            <DialogDescription className="sr-only">
              View and manage subject dates, times, and venues for this exam.
            </DialogDescription>
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
              <SearchableSelect
                value={scheduleForm.subjectName}
                onValueChange={(v) => setScheduleForm((f) => ({ ...f, subjectName: v }))}
                placeholder="Select subject"
                options={scheduleSubjects.map((s) => ({ value: s.name, label: s.name + (s.code ? ` (${s.code})` : "") }))}
                disabled={scheduleSubjects.length === 0}
                emptyMessage="No subjects assigned to this exam's classes."
              />
              {scheduleSubjects.length === 0 && (
                <p className="text-xs text-muted-foreground">No class-assigned subjects found for this exam scope.</p>
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
