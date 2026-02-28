import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api";
import { BarChart3, Download } from "lucide-react";

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

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => String(row[h] ?? "").replace(/"/g, '""')).map((c) => `"${c}"`).join(","));
  }
  return lines.join("\n");
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

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("enrollment");

  useEffect(() => {
    (async () => {
      try {
        const [cList, eList] = await Promise.all([
          fetchApi("/Classes") as Promise<ClassDto[]>,
          fetchApi("/Exams") as Promise<ExamDto[]>,
        ]);
        setClasses(Array.isArray(cList) ? cList : []);
        setExams(Array.isArray(eList) ? eList : []);
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
    const csv = toCsv(enrollment.map((r) => ({ ClassName: r.className, StudentCount: r.studentCount })));
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "enrollment-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportBatchStrength = () => {
    const csv = toCsv(batchStrength.map((r) => ({ Class: r.className, Batch: r.batchName, StudentCount: r.studentCount })));
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "batch-strength-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportFinancial = () => {
    if (!financial) return;
    const rows = [
      { Metric: "Total Collection", Value: financial.totalCollection },
      { Metric: "Total Outstanding", Value: financial.totalOutstanding },
      ...financial.outstandingByClass.map((r) => ({ Metric: `Outstanding - ${r.className}`, Value: r.outstanding })),
    ];
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "financial-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportAttendance = () => {
    const csv = toCsv(
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
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "attendance-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportAcademic = () => {
    if (!academic) return;
    const csv = toCsv(
      academic.rows.map((r) => ({
        Rank: r.rank,
        StudentName: r.studentName,
        TotalObtained: r.totalObtained,
        TotalMax: r.totalMax,
        Percentage: r.percentage,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "academic-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
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
      const csv = toCsv([
        { Metric: "New Enquiries", Value: admissionConversion.newEnquiries },
        { Metric: "Contacted", Value: admissionConversion.contacted },
        { Metric: "Interview Scheduled", Value: admissionConversion.interviewScheduled },
        { Metric: "Admitted (in range)", Value: admissionConversion.admittedInRange },
      ]);
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "admission-conversion.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    } else if (customReportType === "workload" && teacherWorkload.length > 0) {
      const csv = toCsv(teacherWorkload.map((r) => ({ Teacher: r.teacherName, PeriodsPerWeek: r.periodsPerWeek })));
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "teacher-workload.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  return (
    <div className="space-y-4">
      <DashboardHeader title="Reports" description="Predefined reports and export" />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reports & Analytics
            </CardTitle>
            <CardDescription>View and export enrollment, financial, attendance, and academic reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
                <TabsTrigger value="batch">Batch Strength</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="enrollment" className="space-y-4 pt-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={classFilter} onValueChange={setClassFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All classes</SelectItem>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select value={classFilter} onValueChange={setClassFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All classes</SelectItem>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                          <span className="text-lg font-semibold">₹{financial.totalCollection.toLocaleString()}</span>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <span className="text-lg font-semibold">₹{financial.totalOutstanding.toLocaleString()}</span>
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
                            <TableCell className="text-right">₹{r.outstanding.toLocaleString()}</TableCell>
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
                    <Select value={classFilter} onValueChange={setClassFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select value={examId} onValueChange={setExamId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select exam" />
                      </SelectTrigger>
                      <SelectContent>
                        {exams.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.name} {e.className ? `(${e.className})` : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select value={customReportType} onValueChange={(v: "admission" | "workload") => setCustomReportType(v)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admission">Admission Conversion</SelectItem>
                        <SelectItem value="workload">Teacher Workload</SelectItem>
                      </SelectContent>
                    </Select>
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
