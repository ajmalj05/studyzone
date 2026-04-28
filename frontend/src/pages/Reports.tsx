import { useState, useEffect } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api";
import { Download } from "lucide-react";

interface ClassDto {
  id: string;
  name: string;
}

interface EnrollmentRow {
  classId: string;
  className: string;
  studentCount: number;
}

interface BatchStrengthRow {
  className: string;
  batchName: string;
  studentCount: number;
}

interface FinancialReport {
  from: string | null;
  to: string | null;
  totalCollection: number;
  totalOutstanding: number;
  outstandingByClass: { className: string; outstanding: number; studentCount: number }[];
}

interface AttendanceRow {
  studentId: string;
  studentName: string;
  className?: string;
  presentDays: number;
  absentDays: number;
  totalDays: number;
  percentage: number;
  chronicAbsentee: boolean;
}

interface AcademicRow {
  studentId: string;
  studentName: string;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  rank: number;
}

interface ExamDto {
  id: string;
  name: string;
  classId?: string;
  className?: string;
}

interface AdmissionConversionReport {
  from: string | null;
  to: string | null;
  newEnquiries: number;
  contacted: number;
  interviewScheduled: number;
  admittedInRange: number;
}

interface TeacherWorkloadRow {
  teacherUserId: string;
  teacherName: string;
  periodsPerWeek: number;
}

interface StudentLiteDto {
  id: string;
  name: string;
  admissionNumber?: string;
  classId?: string;
  className?: string;
  batchId?: string;
  batchName?: string;
}

interface TeacherLiteDto {
  id: string;
  name: string;
  userId: string;
}

interface BatchLiteDto {
  id: string;
  name: string;
  className?: string;
}

interface TimetableSlotRow {
  id: string;
  batchId: string;
  batchName: string;
  dayOfWeek: number;
  periodOrder: number;
  subject: string;
  room?: string;
  teacherUserId?: string;
  teacherName?: string;
}

interface ExamMarkRow {
  studentId: string;
  studentName: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
}

const WEEKDAY_LABEL: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => String(row[h] ?? "").replace(/"/g, '""')).map((c) => `"${c}"`).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function eachDateIso(fromIso: string, toIso: string): string[] {
  if (!fromIso || !toIso) return [];
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return [];
  const out: string[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export default function Reports() {
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [examId, setExamId] = useState("");
  const [exams, setExams] = useState<ExamDto[]>([]);

  const [enrollment, setEnrollment] = useState<EnrollmentRow[]>([]);
  const [batchStrength, setBatchStrength] = useState<BatchStrengthRow[]>([]);
  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [academic, setAcademic] = useState<{ examName: string; className?: string; rows: AcademicRow[] } | null>(null);
  const [customReportType, setCustomReportType] = useState<"admission" | "workload">("admission");
  const [admissionConversion, setAdmissionConversion] = useState<AdmissionConversionReport | null>(null);
  const [teacherWorkload, setTeacherWorkload] = useState<TeacherWorkloadRow[]>([]);
  const [students, setStudents] = useState<StudentLiteDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherLiteDto[]>([]);
  const [batches, setBatches] = useState<BatchLiteDto[]>([]);
  const [downloadExamId, setDownloadExamId] = useState("");
  const [downloadSubject, setDownloadSubject] = useState("");
  const [downloadStudentId, setDownloadStudentId] = useState("");
  const [downloadTeacherId, setDownloadTeacherId] = useState("");
  const [downloadClassId, setDownloadClassId] = useState("all");
  const [downloadFrom, setDownloadFrom] = useState("");
  const [downloadTo, setDownloadTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("enrollment");

  usePageHeaderConfigEffect(
    { title: "Reports", description: "Predefined reports and export" },
    [],
  );

  useEffect(() => {
    (async () => {
      try {
        const [cList, eList] = await Promise.all([
          fetchApi("/Classes") as Promise<ClassDto[]>,
          fetchApi("/Exams") as Promise<ExamDto[]>,
        ]);
        setClasses(Array.isArray(cList) ? cList : []);
        setExams(Array.isArray(eList) ? eList : []);
        const [studentRes, teacherRes, batchRes] = await Promise.all([
          fetchApi("/Students?status=Active&take=1000").catch(() => []),
          fetchApi("/Users?role=teacher").catch(() => []),
          fetchApi("/Batches").catch(() => []),
        ]);
        const studentItems = Array.isArray(studentRes)
          ? (studentRes as StudentLiteDto[])
          : ((studentRes as { items?: StudentLiteDto[] })?.items ?? []);
        setStudents(studentItems);
        setTeachers(Array.isArray(teacherRes) ? (teacherRes as TeacherLiteDto[]) : []);
        setBatches(Array.isArray(batchRes) ? (batchRes as BatchLiteDto[]) : []);
      } catch (_) {}
    })();
  }, []);

  const loadEnrollment = async () => {
    setLoading(true);
    try {
      const url = classFilter && classFilter !== "all" ? `/Reports/enrollment?classId=${classFilter}` : "/Reports/enrollment";
      const data = (await fetchApi(url)) as EnrollmentRow[];
      setEnrollment(Array.isArray(data) ? data : []);
    } catch (_) {
      setEnrollment([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchStrength = async () => {
    setLoading(true);
    try {
      const url = classFilter && classFilter !== "all" ? `/Reports/batch-strength?classId=${classFilter}` : "/Reports/batch-strength";
      const data = (await fetchApi(url)) as BatchStrengthRow[];
      setBatchStrength(Array.isArray(data) ? data : []);
    } catch (_) {
      setBatchStrength([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancial = async () => {
    setLoading(true);
    try {
      const from = dateFrom ? `&from=${dateFrom}` : "";
      const to = dateTo ? `&to=${dateTo}` : "";
      const data = (await fetchApi(`/Reports/financial?${from}${to}`.replace(/^&/, ""))) as FinancialReport;
      setFinancial(data ?? null);
    } catch (_) {
      setFinancial(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    try {
      const classQ = classFilter && classFilter !== "all" ? `&classId=${classFilter}` : "";
      const data = (await fetchApi(`/Reports/attendance?from=${dateFrom}&to=${dateTo}${classQ}`)) as {
        rows: AttendanceRow[];
      };
      setAttendance(Array.isArray(data?.rows) ? data.rows : []);
    } catch (_) {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAcademic = async () => {
    if (!examId) return;
    setLoading(true);
    try {
      const data = (await fetchApi(`/Reports/academic?examId=${examId}`)) as {
        examName: string;
        className?: string;
        rows: AcademicRow[];
      };
      setAcademic(data ? { examName: data.examName, className: data.className, rows: data.rows ?? [] } : null);
    } catch (_) {
      setAcademic(null);
    } finally {
      setLoading(false);
    }
  };

  const exportEnrollment = () => {
    downloadCsv("enrollment-report.csv", enrollment.map((r) => ({ ClassName: r.className, StudentCount: r.studentCount })));
  };

  const exportBatchStrength = () => {
    downloadCsv("batch-strength-report.csv", batchStrength.map((r) => ({ Class: r.className, Batch: r.batchName, StudentCount: r.studentCount })));
  };

  const exportFinancial = () => {
    if (!financial) return;
    const rows = [
      { Metric: "Total Collection", Value: financial.totalCollection },
      { Metric: "Total Outstanding", Value: financial.totalOutstanding },
      ...financial.outstandingByClass.map((r) => ({ Metric: `Outstanding - ${r.className}`, Value: r.outstanding })),
    ];
    downloadCsv("financial-report.csv", rows);
  };

  const exportAttendance = () => {
    downloadCsv("attendance-report.csv",
      attendance.map((r) => ({
        StudentName: r.studentName,
        Class: r.className ?? "",
        PresentDays: r.presentDays,
        AbsentDays: r.absentDays,
        TotalDays: r.totalDays,
        Percentage: r.percentage,
        ChronicAbsentee: r.chronicAbsentee ? "Yes" : "No",
      }))
    );
  };

  const exportAcademic = () => {
    if (!academic) return;
    downloadCsv("academic-report.csv",
      academic.rows.map((r) => ({
        Rank: r.rank,
        StudentName: r.studentName,
        TotalObtained: r.totalObtained,
        TotalMax: r.totalMax,
        Percentage: r.percentage,
      }))
    );
  };

  const loadCustomReport = async () => {
    setLoading(true);
    try {
      if (customReportType === "admission") {
        const from = dateFrom ? `&from=${dateFrom}` : "";
        const to = dateTo ? `&to=${dateTo}` : "";
        const data = (await fetchApi(`/Reports/admission-conversion?${from}${to}`.replace(/^&/, ""))) as AdmissionConversionReport;
        setAdmissionConversion(data);
        setTeacherWorkload([]);
      } else {
        const data = (await fetchApi("/Reports/teacher-workload")) as { rows: TeacherWorkloadRow[] };
        setTeacherWorkload(data.rows ?? []);
        setAdmissionConversion(null);
      }
    } catch (_) {
      setAdmissionConversion(null);
      setTeacherWorkload([]);
    } finally {
      setLoading(false);
    }
  };

  const exportCustomReport = () => {
    if (customReportType === "admission" && admissionConversion) {
      downloadCsv("admission-conversion.csv", [
        { Metric: "New Enquiries", Value: admissionConversion.newEnquiries },
        { Metric: "Contacted", Value: admissionConversion.contacted },
        { Metric: "Interview Scheduled", Value: admissionConversion.interviewScheduled },
        { Metric: "Admitted (in range)", Value: admissionConversion.admittedInRange },
      ]);
    } else if (customReportType === "workload" && teacherWorkload.length > 0) {
      downloadCsv("teacher-workload.csv", teacherWorkload.map((r) => ({ Teacher: r.teacherName, PeriodsPerWeek: r.periodsPerWeek })));
    }
  };

  const exportStudentTimetable = async () => {
    if (!downloadStudentId) return;
    const student = students.find((s) => s.id === downloadStudentId);
    if (!student?.batchId) return;
    try {
      const slots = (await fetchApi(`/Timetable/batch/${student.batchId}`)) as TimetableSlotRow[];
      const rows = (Array.isArray(slots) ? slots : [])
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.periodOrder - b.periodOrder)
        .map((s) => ({
          Student: student.name,
          AdmissionNo: student.admissionNumber ?? "",
          Batch: s.batchName,
          Day: s.dayOfWeek,
          Period: s.periodOrder,
          Subject: s.subject,
          Teacher: s.teacherName ?? "",
          Room: s.room ?? "",
        }));
      downloadCsv(`student-timetable-${student.name}.csv`, rows);
    } catch {}
  };

  const exportTeacherTimetable = async () => {
    if (!downloadTeacherId) return;
    const teacher = teachers.find((t) => t.userId === downloadTeacherId || t.id === downloadTeacherId);
    try {
      const sourceBatches =
        batches.length > 0
          ? batches
          : (((await fetchApi("/Batches").catch(() => [])) as BatchLiteDto[]) ?? []);
      if (sourceBatches.length === 0) return;
      const allSlots = (
        await Promise.all(
          sourceBatches.map((b) =>
            fetchApi(`/Timetable/batch/${b.id}`).catch(() => [] as TimetableSlotRow[])
          )
        )
      ).flat();
      const rows = allSlots
        .filter((s) => s.teacherUserId === downloadTeacherId)
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.periodOrder - b.periodOrder)
        .map((s) => ({
          Teacher: teacher?.name ?? downloadTeacherId,
          Batch: s.batchName,
          Day: WEEKDAY_LABEL[s.dayOfWeek] ?? String(s.dayOfWeek),
          Period: s.periodOrder,
          Subject: s.subject,
          Room: s.room ?? "",
        }));
      downloadCsv(`teacher-timetable-${teacher?.name ?? "teacher"}.csv`, rows);
    } catch {}
  };

  const exportMarkListSingleStudentAllSubjects = async () => {
    if (!downloadExamId || !downloadStudentId) return;
    try {
      const marks = (await fetchApi(`/Exams/${downloadExamId}/marks`)) as ExamMarkRow[];
      const student = students.find((s) => s.id === downloadStudentId);
      const rows = (Array.isArray(marks) ? marks : [])
        .filter((m) => m.studentId === downloadStudentId)
        .map((m) => ({
          Student: m.studentName,
          Subject: m.subject,
          MarksObtained: m.marksObtained,
          MaxMarks: m.maxMarks,
        }));
      downloadCsv(`mark-list-${student?.name ?? "student"}-all-subjects.csv`, rows);
    } catch {}
  };

  const exportMarkListAllStudentsSingleSubject = async () => {
    if (!downloadExamId || !downloadSubject.trim()) return;
    try {
      const marks = (await fetchApi(`/Exams/${downloadExamId}/marks`)) as ExamMarkRow[];
      const rows = (Array.isArray(marks) ? marks : [])
        .filter((m) => m.subject.toLowerCase() === downloadSubject.trim().toLowerCase())
        .map((m) => ({
          Subject: m.subject,
          Student: m.studentName,
          MarksObtained: m.marksObtained,
          MaxMarks: m.maxMarks,
        }));
      downloadCsv(`mark-list-${downloadSubject.trim()}-all-students.csv`, rows);
    } catch {}
  };

  const exportTeacherAttendanceSingle = async () => {
    if (!downloadTeacherId || !downloadFrom || !downloadTo) return;
    const teacher = teachers.find((t) => t.userId === downloadTeacherId || t.id === downloadTeacherId);
    try {
      const rowsRaw = (await fetchApi(`/Attendance/teacher/${downloadTeacherId}?from=${downloadFrom}&to=${downloadTo}`)) as Array<{
        date: string;
        status: string;
      }>;
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        Teacher: teacher?.name ?? downloadTeacherId,
        Date: r.date?.slice(0, 10),
        Status: r.status,
      }));
      downloadCsv(`teacher-attendance-${teacher?.name ?? "teacher"}.csv`, rows);
    } catch {}
  };

  const exportTeacherAttendanceAll = async () => {
    if (!downloadFrom || !downloadTo) return;
    const days = eachDateIso(downloadFrom, downloadTo);
    if (days.length === 0) return;
    try {
      const perDay = await Promise.all(
        days.map((d) => fetchApi(`/Attendance/teachers?date=${new Date(`${d}T12:00:00`).toISOString()}`).catch(() => []))
      );
      const rows: Record<string, unknown>[] = [];
      perDay.forEach((entries, index) => {
        const day = days[index];
        (Array.isArray(entries) ? entries : []).forEach((e) => {
          const row = e as { teacherName?: string; status?: string };
          rows.push({ Date: day, Teacher: row.teacherName ?? "", Status: row.status ?? "" });
        });
      });
      downloadCsv("teacher-attendance-all.csv", rows);
    } catch {}
  };

  const exportStudentAttendanceSingle = async () => {
    if (!downloadStudentId || !downloadFrom || !downloadTo) return;
    const student = students.find((s) => s.id === downloadStudentId);
    try {
      const detail = (await fetchApi(`/Reports/attendance/student?studentId=${downloadStudentId}&from=${downloadFrom}&to=${downloadTo}`)) as {
        studentName?: string;
        rows?: Array<{ date?: string; status?: string; className?: string }>;
      };
      const rows = (detail?.rows ?? []).map((r) => ({
        Student: detail.studentName || student?.name || "",
        Date: r.date?.slice(0, 10),
        Status: r.status ?? "",
        Class: r.className ?? "",
      }));
      downloadCsv(`student-attendance-${student?.name ?? "student"}.csv`, rows);
    } catch {}
  };

  const exportStudentAttendanceAll = async () => {
    if (!downloadFrom || !downloadTo) return;
    try {
      const classQ = downloadClassId !== "all" ? `&classId=${downloadClassId}` : "";
      const data = (await fetchApi(`/Reports/attendance?from=${downloadFrom}&to=${downloadTo}${classQ}`)) as {
        rows: AttendanceRow[];
      };
      const rows = (data?.rows ?? []).map((r) => ({
        Student: r.studentName,
        Class: r.className ?? "",
        PresentDays: r.presentDays,
        AbsentDays: r.absentDays,
        TotalDays: r.totalDays,
        Percentage: r.percentage,
      }));
      downloadCsv("student-attendance-all.csv", rows);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Reports & Analytics
            </CardTitle>
            <CardDescription>View and export enrollment, financial, attendance, and academic reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
                <TabsTrigger value="batch">Batch Strength</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
                <TabsTrigger value="downloads">Downloads</TabsTrigger>
              </TabsList>

              <TabsContent value="enrollment" className="space-y-4 pt-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <SearchableSelect
                      value={classFilter}
                      onValueChange={setClassFilter}
                      placeholder="All classes"
                      className="w-48"
                      options={[
                        { value: "all", label: "All classes" },
                        ...classes.map((c) => ({ value: c.id, label: c.name })),
                      ]}
                    />
                  </div>
                  <Button onClick={loadEnrollment} disabled={loading}>Load</Button>
                  <Button variant="outline" size="icon" onClick={exportEnrollment} disabled={enrollment.length === 0}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollment.map((r) => (
                      <TableRow key={r.classId || r.className}>
                        <TableCell>{r.className}</TableCell>
                        <TableCell className="text-right">{r.studentCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="batch" className="space-y-4 pt-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <SearchableSelect
                      value={classFilter}
                      onValueChange={setClassFilter}
                      placeholder="All classes"
                      className="w-48"
                      options={[
                        { value: "all", label: "All classes" },
                        ...classes.map((c) => ({ value: c.id, label: c.name })),
                      ]}
                    />
                  </div>
                  <Button onClick={loadBatchStrength} disabled={loading}>Load</Button>
                  <Button variant="outline" size="icon" onClick={exportBatchStrength} disabled={batchStrength.length === 0}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchStrength.map((r, i) => (
                      <TableRow key={`${r.className}-${r.batchName}-${i}`}>
                        <TableCell>{r.className}</TableCell>
                        <TableCell>{r.batchName}</TableCell>
                        <TableCell className="text-right">{r.studentCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 pt-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                  <Button onClick={loadFinancial} disabled={loading}>Load</Button>
                  <Button variant="outline" size="icon" onClick={exportFinancial} disabled={!financial}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                {financial && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Total Collection</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <span className="text-lg font-semibold">AED {financial.totalCollection.toLocaleString("en-AE")}</span>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <span className="text-lg font-semibold">AED {financial.totalOutstanding.toLocaleString("en-AE")}</span>
                        </CardContent>
                      </Card>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Class</TableHead>
                          <TableHead className="text-right">Outstanding</TableHead>
                          <TableHead className="text-right">Students</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financial.outstandingByClass.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell>{r.className || "—"}</TableCell>
                            <TableCell className="text-right">AED {r.outstanding.toLocaleString("en-AE")}</TableCell>
                            <TableCell className="text-right">{r.studentCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </TabsContent>

              <TabsContent value="attendance" className="space-y-4 pt-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <SearchableSelect
                      value={classFilter}
                      onValueChange={setClassFilter}
                      placeholder="All"
                      className="w-48"
                      options={[
                        { value: "all", label: "All" },
                        ...classes.map((c) => ({ value: c.id, label: c.name })),
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                  <Button onClick={loadAttendance} disabled={loading || !dateFrom || !dateTo}>Load</Button>
                  <Button variant="outline" size="icon" onClick={exportAttendance} disabled={attendance.length === 0}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Present</TableHead>
                      <TableHead className="text-right">Absent</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead>Chronic</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((r) => (
                      <TableRow key={r.studentId} className={r.chronicAbsentee ? "bg-destructive/10" : ""}>
                        <TableCell>{r.studentName}</TableCell>
                        <TableCell>{r.className ?? "—"}</TableCell>
                        <TableCell className="text-right">{r.presentDays}</TableCell>
                        <TableCell className="text-right">{r.absentDays}</TableCell>
                        <TableCell className="text-right">{r.totalDays}</TableCell>
                        <TableCell className="text-right">{r.percentage}%</TableCell>
                        <TableCell>{r.chronicAbsentee ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="academic" className="space-y-4 pt-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2">
                    <Label>Exam</Label>
                    <SearchableSelect
                      value={examId}
                      onValueChange={setExamId}
                      placeholder="Select exam"
                      className="w-64"
                      options={exams.map((e) => ({ value: e.id, label: `${e.name}${e.className ? ` (${e.className})` : ""}` }))}
                    />
                  </div>
                  <Button onClick={loadAcademic} disabled={loading || !examId}>Load</Button>
                  <Button variant="outline" size="icon" onClick={exportAcademic} disabled={!academic?.rows?.length}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                {academic && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {academic.examName} {academic.className ? `— ${academic.className}` : ""}
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">Obtained</TableHead>
                          <TableHead className="text-right">Max</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {academic.rows.map((r) => (
                          <TableRow key={r.studentId}>
                            <TableCell>{r.rank}</TableCell>
                            <TableCell>{r.studentName}</TableCell>
                            <TableCell className="text-right">{r.totalObtained}</TableCell>
                            <TableCell className="text-right">{r.totalMax}</TableCell>
                            <TableCell className="text-right">{r.percentage}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </TabsContent>

              <TabsContent value="custom" className="space-y-4 pt-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2">
                    <Label>Report type</Label>
                    <SearchableSelect
                      value={customReportType}
                      onValueChange={(v) => setCustomReportType(v as "admission" | "workload")}
                      className="w-48"
                      options={[
                        { value: "admission", label: "Admission Conversion" },
                        { value: "workload", label: "Teacher Workload" },
                      ]}
                    />
                  </div>
                  {customReportType === "admission" && (
                    <>
                      <div className="space-y-2">
                        <Label>From</Label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>To</Label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                      </div>
                    </>
                  )}
                  <Button onClick={loadCustomReport} disabled={loading}>Load</Button>
                  <Button variant="outline" size="icon" onClick={exportCustomReport} disabled={customReportType === "admission" ? !admissionConversion : teacherWorkload.length === 0}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                {customReportType === "admission" && admissionConversion && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">New Enquiries</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold">{admissionConversion.newEnquiries}</span></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle></CardHeader><CardContent><span className="text-lg font-semibold">{admissionConversion.contacted}</span></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Interview Scheduled</CardTitle></CardHeader><CardContent><span className="text-2xl font-bold">{admissionConversion.interviewScheduled}</span></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Admitted (range)</CardTitle></CardHeader><CardContent><span className="text-lg font-semibold">{admissionConversion.admittedInRange}</span></CardContent></Card>
                  </div>
                )}
                {customReportType === "workload" && teacherWorkload.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Teacher</TableHead><TableHead className="text-right">Periods / week</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherWorkload.map((r) => (
                        <TableRow key={r.teacherUserId}><TableCell>{r.teacherName || r.teacherUserId}</TableCell><TableCell className="text-right">{r.periodsPerWeek}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="downloads" className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Student Timetable</CardTitle>
                      <CardDescription>Download timetable for one student.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <SearchableSelect
                        value={downloadStudentId}
                        onValueChange={setDownloadStudentId}
                        placeholder="Select student"
                        options={students.map((s) => ({ value: s.id, label: `${s.name}${s.batchName ? ` (${s.batchName})` : ""}` }))}
                      />
                      <Button onClick={exportStudentTimetable} disabled={!downloadStudentId}>
                        <Download className="mr-2 h-4 w-4" /> Download Student Timetable
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Teacher Timetable</CardTitle>
                      <CardDescription>Download timetable for one teacher.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <SearchableSelect
                        value={downloadTeacherId}
                        onValueChange={setDownloadTeacherId}
                        placeholder="Select teacher"
                        options={teachers.map((t) => ({ value: t.userId || t.id, label: t.name }))}
                      />
                      <Button onClick={exportTeacherTimetable} disabled={!downloadTeacherId}>
                        <Download className="mr-2 h-4 w-4" /> Download Teacher Timetable
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Mark List</CardTitle>
                      <CardDescription>Single student (all subjects) and single subject (all students).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <SearchableSelect
                        value={downloadExamId}
                        onValueChange={setDownloadExamId}
                        placeholder="Select exam"
                        options={exams.map((e) => ({ value: e.id, label: e.name }))}
                      />
                      <SearchableSelect
                        value={downloadStudentId}
                        onValueChange={setDownloadStudentId}
                        placeholder="Select student (for single student export)"
                        options={students.map((s) => ({ value: s.id, label: s.name }))}
                      />
                      <Button onClick={exportMarkListSingleStudentAllSubjects} disabled={!downloadExamId || !downloadStudentId}>
                        <Download className="mr-2 h-4 w-4" /> Mark List: Single Student (All Subjects)
                      </Button>
                      <Input
                        value={downloadSubject}
                        onChange={(e) => setDownloadSubject(e.target.value)}
                        placeholder="Subject name (for all students export)"
                      />
                      <Button onClick={exportMarkListAllStudentsSingleSubject} disabled={!downloadExamId || !downloadSubject.trim()}>
                        <Download className="mr-2 h-4 w-4" /> Mark List: All Students (Single Subject)
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Attendance Sheets</CardTitle>
                      <CardDescription>Teacher and student attendance downloads.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input type="date" value={downloadFrom} onChange={(e) => setDownloadFrom(e.target.value)} />
                        <Input type="date" value={downloadTo} onChange={(e) => setDownloadTo(e.target.value)} />
                      </div>
                      <SearchableSelect
                        value={downloadTeacherId}
                        onValueChange={setDownloadTeacherId}
                        placeholder="Select teacher (single teacher sheet)"
                        options={teachers.map((t) => ({ value: t.userId || t.id, label: t.name }))}
                      />
                      <Button onClick={exportTeacherAttendanceSingle} disabled={!downloadTeacherId || !downloadFrom || !downloadTo}>
                        <Download className="mr-2 h-4 w-4" /> Attendance: Single Teacher
                      </Button>
                      <Button onClick={exportTeacherAttendanceAll} disabled={!downloadFrom || !downloadTo}>
                        <Download className="mr-2 h-4 w-4" /> Attendance: All Teachers
                      </Button>
                      <SearchableSelect
                        value={downloadStudentId}
                        onValueChange={setDownloadStudentId}
                        placeholder="Select student (single student sheet)"
                        options={students.map((s) => ({ value: s.id, label: s.name }))}
                      />
                      <Button onClick={exportStudentAttendanceSingle} disabled={!downloadStudentId || !downloadFrom || !downloadTo}>
                        <Download className="mr-2 h-4 w-4" /> Attendance: Single Student
                      </Button>
                      <SearchableSelect
                        value={downloadClassId}
                        onValueChange={setDownloadClassId}
                        placeholder="Class filter for all students"
                        options={[
                          { value: "all", label: "All classes" },
                          ...classes.map((c) => ({ value: c.id, label: c.name })),
                        ]}
                      />
                      <Button onClick={exportStudentAttendanceAll} disabled={!downloadFrom || !downloadTo}>
                        <Download className="mr-2 h-4 w-4" /> Attendance: All Students
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
