import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import {
  CalendarDays, Download, FileText, LayoutGrid, PencilLine,
  Clock, BookOpen, X, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDocumentHeader, getDocumentFooter, getStandardDocumentCss, type SchoolProfileForReceipt } from "@/lib/receiptHtml";

interface ExamDto {
  id: string; name: string; type: string;
  classId?: string; className?: string;
  classIds?: string[]; classNames?: string[];
  classWideClassIds?: string[];
  batchIds?: string[]; batchNames?: string[];
  maxMarks?: number;
  examDate?: string; createdAt: string;
}
interface MarksEntryDto {
  id: string; studentId: string; studentName: string;
  subject: string; marksObtained: number; maxMarks: number;
  status?: string; rejectionReason?: string | null;
}
interface StudentDto { id: string; name: string; admissionNumber?: string; batchId?: string; }
interface SubjectDto { id: string; name: string; code?: string; }
interface TeacherAssignedBatchDto {
  id: string; name: string; classId: string; className: string;
  isClassTeacher?: boolean; subjectsTaught?: string[];
}
interface ExamScheduleEntryDto {
  id: string; examId: string; subjectName: string; classId?: string;
  scheduledDate: string; startTime?: string; endTime?: string; venue?: string; maxMarks?: number;
}
interface TeacherMarksScopeDto { isClassTeacher: boolean; subjectScope: string[]; }

function scopeFromBatches(batches: TeacherAssignedBatchDto[], classId: string): TeacherMarksScopeDto | null {
  const relevant = batches.filter((b) => b.classId === classId);
  if (relevant.length === 0) return null;
  const isClassTeacher = relevant.some((b) => b.isClassTeacher);
  const subs = new Set<string>();
  relevant.forEach((b) => (b.subjectsTaught ?? []).forEach((s) => subs.add(s.trim())));
  return { isClassTeacher, subjectScope: [...subs].sort((a, b) => a.localeCompare(b)) };
}

const getGrade = (marks: number) => {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B+";
  if (marks >= 60) return "B";
  if (marks >= 50) return "C";
  return "F";
};

function buildEntrySubjects(classSubjects: SubjectDto[], scope: TeacherMarksScopeDto | null) {
  if (!scope || scope.isClassTeacher) return classSubjects.map((s) => ({ id: s.id, name: s.name }));
  if (scope.subjectScope.length === 0) return [];
  const scopeSet = new Set(scope.subjectScope.map((s) => s.trim().toLowerCase()));
  const matched: { id: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const s of classSubjects) {
    const key = s.name.trim().toLowerCase();
    if (scopeSet.has(key) && !seen.has(key)) { seen.add(key); matched.push({ id: s.id, name: s.name }); }
  }
  for (const sub of scope.subjectScope) {
    const key = sub.trim().toLowerCase();
    if (!seen.has(key)) { seen.add(key); matched.push({ id: `scope-${key}`, name: sub.trim() }); }
  }
  return matched.sort((a, b) => a.name.localeCompare(b.name));
}

const TYPE_LABEL: Record<string, string> = { UnitTest: "Unit Test", MidTerm: "Mid Term", Final: "Final" };
const TYPE_COLOR: Record<string, string> = {
  UnitTest: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300",
  MidTerm: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300",
  Final: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300",
};

const TeacherExams = () => {
  const [assignedBatches, setAssignedBatches] = useState<TeacherAssignedBatchDto[]>([]);
  const [exams, setExams] = useState<ExamDto[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [marksScope, setMarksScope] = useState<TeacherMarksScopeDto | null>(null);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [classSubjects, setClassSubjects] = useState<SubjectDto[]>([]);
  const [marks, setMarks] = useState<MarksEntryDto[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ExamScheduleEntryDto[]>([]);
  const [marksByStudentSubject, setMarksByStudentSubject] = useState<Record<string, { obtained: string; max: string }>>({});
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingExamData, setLoadingExamData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [panelTab, setPanelTab] = useState<"overview" | "entry" | "schedule">("overview");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchApi("/TeacherPortal/assigned-batches").catch(() => []) as Promise<TeacherAssignedBatchDto[]>,
      fetchApi("/Exams").catch(() => []) as Promise<ExamDto[]>,
    ])
      .then(([batches, examList]) => {
        setAssignedBatches(Array.isArray(batches) ? batches : []);
        setExams(Array.isArray(examList) ? examList : []);
      })
      .catch((e: Error) => toast({ title: "Error", description: e.message || "Failed to load", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const selectedExamClassId = useMemo(() => {
    if (!selectedExam) return "";
    const assignedClassIds = new Set(assignedBatches.map((b) => b.classId));
    const classWideMatch = selectedExam.classWideClassIds?.find((classId) => assignedClassIds.has(classId));
    if (classWideMatch) return classWideMatch;
    const batchMatch = assignedBatches.find((b) => selectedExam.batchIds?.includes(b.id));
    return batchMatch?.classId ?? selectedExam.classId ?? "";
  }, [assignedBatches, selectedExam]);
  const selectedExamBatchIdsForClass = useMemo(() => {
    if (!selectedExam || !selectedExamClassId || selectedExam.classWideClassIds?.includes(selectedExamClassId)) return [];
    return (selectedExam.batchIds ?? []).filter((batchId) => assignedBatches.find((b) => b.id === batchId)?.classId === selectedExamClassId);
  }, [assignedBatches, selectedExam, selectedExamClassId]);

  useEffect(() => {
    if (!selectedExamId || !selectedExamClassId) {
      setStudents([]); setClassSubjects([]); setMarks([]); setScheduleEntries([]);
      setMarksByStudentSubject({}); setMarksScope(null);
      return;
    }
    setLoadingExamData(true);
    Promise.all([
      fetchApi(`/Students?classId=${encodeURIComponent(selectedExamClassId)}&status=Active&take=500`) as Promise<{ items: StudentDto[] }>,
      fetchApi(`/Subjects/for-class/${selectedExamClassId}`) as Promise<SubjectDto[]>,
      fetchApi(`/Exams/${selectedExamId}/marks`) as Promise<MarksEntryDto[]>,
      fetchApi(`/Exams/${selectedExamId}/schedule`).catch(() => []) as Promise<ExamScheduleEntryDto[]>,
      fetchApi(`/TeacherPortal/marks-scope?classId=${encodeURIComponent(selectedExamClassId)}`).catch(() => null) as Promise<TeacherMarksScopeDto | null>,
    ])
      .then(([studRes, subjList, marksList, schedList, scope]) => {
        const loadedStudents = studRes?.items ?? [];
        setStudents(selectedExamBatchIdsForClass.length > 0 ? loadedStudents.filter((s) => s.batchId && selectedExamBatchIdsForClass.includes(s.batchId)) : loadedStudents);
        setClassSubjects(Array.isArray(subjList) ? subjList : []);
        setMarks(Array.isArray(marksList) ? marksList : []);
        setScheduleEntries(Array.isArray(schedList) ? schedList : []);
        if (scope) setMarksScope(scope);
        const map: Record<string, { obtained: string; max: string }> = {};
        (marksList || []).forEach((m) => { map[`${m.studentId}:${m.subject}`] = { obtained: String(m.marksObtained), max: String(m.maxMarks) }; });
        setMarksByStudentSubject(map);
      })
      .catch((e: Error) => toast({ title: "Error", description: e.message || "Failed to load exam data", variant: "destructive" }))
      .finally(() => setLoadingExamData(false));
  }, [selectedExamId, selectedExamClassId, selectedExamBatchIdsForClass]);

  const effectiveMarksScope = useMemo(() => {
    if (marksScope) return marksScope;
    if (!selectedExamClassId) return null;
    return scopeFromBatches(assignedBatches, selectedExamClassId);
  }, [marksScope, assignedBatches, selectedExamClassId]);

  const entrySubjectsUnfiltered = useMemo(
    () => buildEntrySubjects(classSubjects, effectiveMarksScope),
    [classSubjects, effectiveMarksScope],
  );

  const entrySubjects = useMemo(() => {
    const base = entrySubjectsUnfiltered;
    return base.filter((s) =>
      scheduleEntries.some(
        (e) =>
          e.subjectName.trim().toLowerCase() === s.name.trim().toLowerCase() &&
          (!e.classId || e.classId === selectedExamClassId),
      ),
    );
  }, [entrySubjectsUnfiltered, scheduleEntries, selectedExamClassId]);

  const scheduleMaxForSubject = useCallback(
    (subjectName: string) => {
      const entry = scheduleEntries.find(
        (e) =>
          e.subjectName.trim().toLowerCase() === subjectName.trim().toLowerCase() &&
          (!e.classId || e.classId === selectedExamClassId),
      );
      if (entry?.maxMarks != null && entry.maxMarks > 0) return String(entry.maxMarks);
      return null;
    },
    [scheduleEntries, selectedExamClassId],
  );

  useEffect(() => {
    if (entrySubjects.length === 0) { setSelectedSubject(""); return; }
    setSelectedSubject((prev) => entrySubjects.some((s) => s.name === prev) ? prev : entrySubjects[0].name);
  }, [entrySubjects]);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const { pastExams, upcomingExams } = useMemo(() => {
    const past: ExamDto[] = [], upcoming: ExamDto[] = [];
    exams.forEach((e) => {
      if (e.examDate && new Date(e.examDate) < today) past.push(e);
      else upcoming.push(e);
    });
    upcoming.sort((a, b) => (!a.examDate ? 1 : !b.examDate ? -1 : new Date(a.examDate).getTime() - new Date(b.examDate).getTime()));
    past.sort((a, b) => new Date(b.examDate!).getTime() - new Date(a.examDate!).getTime());
    return { pastExams: past, upcomingExams: upcoming };
  }, [exams, today]);

  const handleSelectExam = (exam: ExamDto, isPast: boolean) => {
    setSelectedExamId(exam.id);
    setMarksScope(null);
    setPanelTab(isPast ? "entry" : "overview");
    setModalOpen(true);
  };

  const adminMax = selectedExam?.maxMarks != null ? String(selectedExam.maxMarks) : "100";
  const marksCapMax = useMemo(() => {
    if (!selectedSubject.trim()) return adminMax;
    return scheduleMaxForSubject(selectedSubject) ?? adminMax;
  }, [selectedSubject, scheduleMaxForSubject, adminMax]);

  const setMark = (studentId: string, obtained: string) =>
    setMarksByStudentSubject((p) => ({ ...p, [`${studentId}:${selectedSubject}`]: { obtained, max: marksCapMax } }));

  const getCellDisplay = (studentId: string, subjectName: string) => {
    const cap = scheduleMaxForSubject(subjectName) ?? adminMax;
    const val = marksByStudentSubject[`${studentId}:${subjectName}`];
    if (val?.obtained) return `${val.obtained}/${val.max || cap} (${getGrade(parseFloat(val.obtained) || 0)})`;
    const row = marks.find((m) => m.studentId === studentId && m.subject === subjectName);
    if (row) return `${row.marksObtained}/${row.maxMarks}`;
    return "—";
  };

  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedSubject.trim()) {
      toast({ title: "Validation", description: "Select an exam and subject.", variant: "destructive" });
      return;
    }
    setSaving(true);
    let saved = 0, failed = 0;
    for (const s of students) {
      const val = marksByStudentSubject[`${s.id}:${selectedSubject}`];
      if (!val || (val.obtained === "" && val.max === "")) continue;
      const schedCap = scheduleMaxForSubject(selectedSubject);
      const maxMarks = schedCap != null ? parseFloat(schedCap) : parseFloat(val.max) || parseFloat(marksCapMax) || 100;
      const obtained = parseFloat(val.obtained) || 0;
      if (obtained > maxMarks) {
        setSaving(false);
        toast({ title: "Validation", description: `Marks cannot exceed ${maxMarks} for this subject.`, variant: "destructive" });
        return;
      }
      try {
        await fetchApi("/Exams/marks", {
          method: "POST",
          body: JSON.stringify({ examId: selectedExamId, studentId: s.id, subject: selectedSubject, marksObtained: obtained, maxMarks }),
        });
        saved++;
      } catch { failed++; }
    }
    setSaving(false);
    if (saved > 0) {
      toast({ title: "Success", description: `Marks saved for ${saved} student(s).` });
      const list = (await fetchApi(`/Exams/${selectedExamId}/marks`)) as MarksEntryDto[];
      setMarks(Array.isArray(list) ? list : []);
      const map: Record<string, { obtained: string; max: string }> = {};
      (list || []).forEach((m) => { map[`${m.studentId}:${m.subject}`] = { obtained: String(m.marksObtained), max: String(m.maxMarks) }; });
      setMarksByStudentSubject((prev) => ({ ...prev, ...map }));
    }
    if (failed > 0) toast({ title: "Error", description: `${failed} save(s) failed.`, variant: "destructive" });
  };

  const handleExportPdf = async () => {
    if (!selectedExam) return;
    setExporting(true);
    try {
      const school = await fetchApi("/SchoolProfile").catch(() => null) as SchoolProfileForReceipt | null;
      const examDate = selectedExam.examDate
        ? new Date(selectedExam.examDate).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
        : "—";

      const subjectRows = selectedSubject ? students.map((s, i) => {
        const val = marksByStudentSubject[`${s.id}:${selectedSubject}`];
        const obtained = val?.obtained ?? "";
        const max = val?.max ?? "100";
        const grade = obtained ? getGrade(parseFloat(obtained)) : "—";
        const pct = obtained && parseFloat(max) > 0 ? Math.round((parseFloat(obtained) / parseFloat(max)) * 100) + "%" : "—";
        return `<tr>
          <td>${i + 1}</td>
          <td>${s.admissionNumber ?? "—"}</td>
          <td>${s.name}</td>
          <td class="text-right">${obtained !== "" ? obtained : "—"}</td>
          <td class="text-right">${max}</td>
          <td class="text-right">${pct}</td>
          <td style="text-align:center;font-weight:600">${grade}</td>
        </tr>`;
      }).join("") : "";

      const allSubjectRows = entrySubjects.length > 0 && !selectedSubject ? entrySubjects.flatMap(sub =>
        students.map((s, i) => {
          const val = marksByStudentSubject[`${s.id}:${sub.name}`];
          const obtained = val?.obtained ?? "";
          const grade = obtained ? getGrade(parseFloat(obtained)) : "—";
          return `<tr>
            <td>${i + 1}</td>
            <td>${s.admissionNumber ?? "—"}</td>
            <td>${s.name}</td>
            <td>${sub.name}</td>
            <td class="text-right">${obtained !== "" ? obtained : "—"}</td>
            <td class="text-right">${val?.max ?? "100"}</td>
            <td style="text-align:center;font-weight:600">${grade}</td>
          </tr>`;
        })
      ).join("") : "";

      const tableHtml = selectedSubject ? `
        <table>
          <thead><tr>
            <th>#</th><th>Roll No.</th><th>Student Name</th>
            <th class="text-right">Marks</th><th class="text-right">Max</th>
            <th class="text-right">%</th><th style="text-align:center">Grade</th>
          </tr></thead>
          <tbody>${subjectRows}</tbody>
        </table>` : `
        <table>
          <thead><tr>
            <th>#</th><th>Roll No.</th><th>Student Name</th><th>Subject</th>
            <th class="text-right">Marks</th><th class="text-right">Max</th>
            <th style="text-align:center">Grade</th>
          </tr></thead>
          <tbody>${allSubjectRows}</tbody>
        </table>`;

      const selectedClassNameForPdf =
        assignedBatches.find((b) => b.classId === selectedExamClassId)?.className
        ?? selectedExam.className
        ?? "—";
      const selectedBatchNamesForPdf = selectedExamBatchIdsForClass
        .map((id) => assignedBatches.find((b) => b.id === id)?.name)
        .filter((v): v is string => !!v && v.trim().length > 0);

      const metaHtml = `
        <div class="meta-info">
          <p><strong>Class:</strong> ${selectedClassNameForPdf}</p>
          ${selectedBatchNamesForPdf.length ? `<p><strong>Batch:</strong> ${selectedBatchNamesForPdf.join(", ")}</p>` : ""}
          <p><strong>Exam Type:</strong> ${TYPE_LABEL[selectedExam.type] ?? selectedExam.type}</p>
          <p><strong>Date:</strong> ${examDate}</p>
          ${selectedSubject ? `<p><strong>Subject:</strong> ${selectedSubject}</p>` : ""}
          <p><strong>Total Students:</strong> ${students.length}</p>
        </div>`;

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <title>${selectedExam.name} - Marks</title>
        <style>
          ${getStandardDocumentCss()}
          @page { size: A4 portrait; margin: 10mm 12mm; }
        </style>
      </head><body><div class="doc-container">
        ${getDocumentHeader(school, `${selectedExam.name} — Marks Report`)}
        ${metaHtml}
        ${tableHtml}
        ${getDocumentFooter(school)}
      </div></body></html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.addEventListener("load", () => { win.print(); URL.revokeObjectURL(url); });
      }
    } catch {
      toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  // ── Card component ──────────────────────────────────────────────────────────
  const ExamCard = ({ exam, isPast }: { exam: ExamDto; isPast: boolean }) => {
    const daysUntil = exam.examDate
      ? Math.ceil((new Date(exam.examDate).getTime() - today.getTime()) / 86400000)
      : null;

    return (
      <motion.button
        type="button"
        onClick={() => handleSelectExam(exam, isPast)}
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "group w-full rounded-[var(--radius)] border text-left transition-all duration-200 overflow-hidden shadow-sm",
          isPast
            ? "border-amber-200 bg-amber-50/50 hover:shadow-md hover:border-amber-300 dark:bg-amber-900/10 dark:border-amber-800/50"
            : "border-border bg-card hover:shadow-md hover:border-primary/30",
        )}
      >
        <div className="p-4 space-y-3">
          {/* Icon + name/grade + type badge */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] mt-0.5",
              isPast ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10",
            )}>
              {isPast
                ? <PencilLine className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                : <BookOpen className="h-4 w-4 text-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground leading-snug truncate">{exam.name}</p>
              {((exam.classNames && exam.classNames.length > 0) || exam.className) && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {exam.classNames && exam.classNames.length > 0 ? exam.classNames.join(", ") : exam.className}
                {exam.batchNames?.length ? ` · ${exam.batchNames.join(", ")}` : ""}
                </p>
              )}
            </div>
            <span className={cn(
              "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-[var(--radius)] border mt-0.5",
              TYPE_COLOR[exam.type] ?? "bg-muted text-muted-foreground border-border",
            )}>
              {TYPE_LABEL[exam.type] ?? exam.type}
            </span>
          </div>

          {/* Date row */}
          {exam.examDate && (
            <div className={cn(
              "flex items-center justify-between rounded-[var(--radius)] px-3 py-2 text-xs",
              isPast ? "bg-amber-100/70 dark:bg-amber-900/20" : "bg-muted/60",
            )}>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                <span className="text-muted-foreground">
                  {new Date(exam.examDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {isPast ? (
                <span className="font-semibold text-amber-700 dark:text-amber-400">Enter Marks →</span>
              ) : daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 ? (
                <span className="font-semibold text-primary">
                  {daysUntil === 0 ? "Today!" : `${daysUntil}d left`}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </motion.button>
    );
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-44 rounded-2xl border border-border/50 bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-20 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No Exams Assigned To Your Classes Yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {upcomingExams.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Upcoming Exams</h3>
              <span className="ml-auto text-xs text-muted-foreground">{upcomingExams.length} exam{upcomingExams.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {upcomingExams.map((e, i) => (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <ExamCard exam={e} isPast={false} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {pastExams.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Past — Enter Marks</h3>
              <span className="ml-auto text-xs text-muted-foreground">{pastExams.length} exam{pastExams.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {pastExams.map((e, i) => (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <ExamCard exam={e} isPast={true} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* ── Exam Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) setModalOpen(false); }}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 [&>button]:hidden">
          {selectedExam && (
            <>
              {/* Modal header */}
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border/50 shrink-0">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-foreground truncate">{selectedExam.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {((selectedExam.classNames && selectedExam.classNames.length > 0) || selectedExam.className) && (
                      <span className="text-xs text-muted-foreground">
                        {selectedExam.classNames && selectedExam.classNames.length > 0
                          ? selectedExam.classNames.join(", ")
                          : selectedExam.className}
                        {selectedExam.batchNames?.length ? ` · ${selectedExam.batchNames.join(", ")}` : ""}
                      </span>
                    )}
                    {selectedExam.maxMarks != null && (
                      <span className="text-xs text-muted-foreground">· Max: {selectedExam.maxMarks} marks</span>
                    )}
                    <span className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                      TYPE_COLOR[selectedExam.type] ?? "bg-muted text-muted-foreground border-border",
                    )}>
                      {TYPE_LABEL[selectedExam.type] ?? selectedExam.type}
                    </span>
                    {selectedExam.examDate && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(selectedExam.examDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setModalOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6">
                {loadingExamData ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-sm">Loading exam data…</span>
                    </div>
                  </div>
                ) : (
                  <Tabs value={panelTab} onValueChange={(v) => setPanelTab(v as "overview" | "entry" | "schedule")}>
                    <TabsList className="mt-4 mb-5 rounded-xl w-full sm:w-auto">
                      <TabsTrigger value="overview" className="gap-1.5 rounded-lg flex-1 sm:flex-none">
                        <LayoutGrid className="h-4 w-4" /> Overview
                      </TabsTrigger>
                      <TabsTrigger value="entry" className="gap-1.5 rounded-lg flex-1 sm:flex-none">
                        <PencilLine className="h-4 w-4" /> Enter Marks
                      </TabsTrigger>
                      <TabsTrigger value="schedule" className="gap-1.5 rounded-lg flex-1 sm:flex-none">
                        <CalendarDays className="h-4 w-4" /> Schedule
                      </TabsTrigger>
                    </TabsList>

                    {/* Overview tab */}
                    <TabsContent value="overview" className="mt-0">
                      {entrySubjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
                          <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {entrySubjectsUnfiltered.length === 0
                              ? "No subjects available for your role on this class."
                              : scheduleEntries.length === 0
                                ? "Exam timetable is not set yet. Marks and overview will list subjects once the admin schedules them."
                                : "None of your subjects are on the exam timetable for this class. Only scheduled subjects appear here."}
                          </p>
                        </div>
                      ) : students.length === 0 ? (
                        <p className="text-muted-foreground py-10 text-center text-sm">No active students.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-border/60">
                          <table className="w-full min-w-[640px] text-sm">
                            <thead>
                              <tr className="border-b bg-muted/40">
                                <th className="sticky left-0 z-[1] bg-muted/40 px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Student</th>
                                {entrySubjects.map((col) => (
                                  <th key={col.id} className="px-3 py-3 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">{col.name}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {students.map((s, i) => (
                                <tr key={s.id} className={cn("border-b border-border/40 transition-colors hover:bg-muted/20", i % 2 === 0 ? "" : "bg-muted/10")}>
                                  <td className="sticky left-0 z-[1] bg-background px-4 py-3 font-medium">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">
                                        {s.name.charAt(0)}
                                      </div>
                                      <div>
                                        <span className="text-sm font-medium">{s.name}</span>
                                        {s.admissionNumber && <span className="block text-[10px] text-muted-foreground">{s.admissionNumber}</span>}
                                      </div>
                                    </div>
                                  </td>
                                  {entrySubjects.map((col) => (
                                    <td key={col.id} className="px-3 py-3 text-center text-xs tabular-nums font-medium">
                                      {getCellDisplay(s.id, col.name)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TabsContent>

                    {/* Enter marks tab */}
                    <TabsContent value="entry" className="mt-0 space-y-4">
                      {entrySubjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
                          <PencilLine className="h-8 w-8 text-muted-foreground/30 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {entrySubjectsUnfiltered.length === 0
                              ? "No subjects available for marks entry for your role on this class."
                              : scheduleEntries.length === 0
                                ? "Exam timetable is not set yet. You can enter marks only for subjects the admin adds to the schedule."
                                : "None of your subjects are scheduled for this exam. The subject list matches the exam timetable only."}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-end gap-4 flex-wrap">
                              <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</label>
                                <SearchableSelect
                                  value={selectedSubject}
                                  onValueChange={setSelectedSubject}
                                  placeholder="Select subject"
                                  className="w-[240px] rounded-xl"
                                  options={entrySubjects.map((s) => ({ value: s.name, label: s.name }))}
                                />
                              </div>
                              {selectedSubject && (
                                <p className="text-xs text-muted-foreground pb-1.5">
                                  {students.filter((s) => {
                                    const v = marksByStudentSubject[`${s.id}:${selectedSubject}`];
                                    return v?.obtained && v.obtained !== "";
                                  }).length} / {students.length} filled
                                </p>
                              )}
                            </div>
                          </div>

                          {students.length === 0 ? (
                            <p className="text-muted-foreground py-4 text-sm">No Active Students In This Class.</p>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {students.map((s, i) => {
                                  const val = marksByStudentSubject[`${s.id}:${selectedSubject}`] ?? { obtained: "", max: marksCapMax };
                                  const num = parseFloat(val.obtained || "0");
                                  const maxNum = parseFloat(val.max || marksCapMax || "100");
                                  const pct = val.obtained && maxNum > 0 ? Math.round((num / maxNum) * 100) : null;
                                  const grade = val.obtained ? getGrade(num) : "—";
                                  const rowMark = marks.find((m) => m.studentId === s.id && m.subject === selectedSubject);
                                  const approvalStatus = rowMark?.status;
                                  return (
                                    <motion.div
                                      key={s.id}
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.02 }}
                                      className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 hover:bg-muted/20 transition-colors"
                                    >
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-primary text-primary-foreground text-sm font-bold">
                                        {s.admissionNumber?.slice(-2) ?? s.name.charAt(0)}
                                      </div>
                                      <div className="min-w-[140px] flex-1">
                                        <p className="font-semibold text-sm text-foreground">{s.name}</p>
                                        {s.admissionNumber && <p className="text-[10px] text-muted-foreground">{s.admissionNumber}</p>}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          placeholder="Marks"
                                          value={val.obtained}
                                          onChange={(e) => setMark(s.id, e.target.value)}
                                          className="w-24 rounded-xl text-center h-9"
                                          min={0}
                                          max={parseFloat(marksCapMax) || 999}
                                        />
                                        <span className="text-muted-foreground text-sm">/ {marksCapMax}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={cn(
                                          "w-8 text-center text-sm font-bold",
                                          grade === "F" ? "text-destructive" : grade === "A+" ? "text-emerald-600" : "text-primary",
                                        )}>{grade}</span>
                                        {pct !== null && (
                                          <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                                        )}
                                      </div>
                                      {approvalStatus && (
                                        <div className="flex flex-col items-end gap-0.5">
                                          <Badge variant={approvalStatus === "Approved" ? "default" : approvalStatus === "Rejected" ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0">
                                            {approvalStatus}
                                          </Badge>
                                          {approvalStatus === "Rejected" && rowMark?.rejectionReason && (
                                            <span className="text-[10px] text-muted-foreground max-w-[120px] truncate" title={rowMark.rejectionReason}>{rowMark.rejectionReason}</span>
                                          )}
                                        </div>
                                      )}
                                    </motion.div>
                                  );
                                })}
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <Button
                                  variant="outline" size="sm" className="rounded-xl gap-1.5 h-9"
                                  onClick={handleExportPdf}
                                  disabled={exporting || students.length === 0}
                                >
                                  {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                  Export PDF
                                </Button>
                                <Button className="gradient-primary text-primary-foreground rounded-xl px-8 h-10" onClick={handleSaveMarks} disabled={saving || entrySubjects.length === 0 || !selectedSubject}>
                                  {saving ? "Saving…" : "Save Marks"}
                                </Button>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </TabsContent>

                    {/* Schedule tab */}
                    <TabsContent value="schedule" className="mt-0">
                      {scheduleEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-2" />
                          <p className="text-sm font-medium text-muted-foreground">No Schedule Set For This Exam Yet.</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">The Admin Will Add Schedule Entries For Each Subject.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-border/60">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/40">
                                {["Subject", "Date", "Start", "End", "Venue", "Max marks"].map((h) => (
                                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {scheduleEntries.map((entry, i) => (
                                <tr key={entry.id} className={cn("border-b border-border/40 hover:bg-muted/20 transition-colors", i % 2 !== 0 && "bg-muted/10")}>
                                  <td className="px-4 py-3 font-semibold text-foreground">{entry.subjectName}</td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {new Date(entry.scheduledDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">{entry.startTime ?? "—"}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{entry.endTime ?? "—"}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{entry.venue ?? "—"}</td>
                                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{entry.maxMarks != null && entry.maxMarks > 0 ? entry.maxMarks : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
};

export default TeacherExams;
