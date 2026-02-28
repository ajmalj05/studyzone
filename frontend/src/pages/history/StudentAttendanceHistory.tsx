import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar, History, BookOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadModal } from "@/components/DownloadModal";
import { fetchApi } from "@/lib/api";
import { DashboardHeader } from "@/components/DashboardHeader";

interface AttendanceReportRowDto {
  studentId: string;
  studentName: string;
  className?: string;
  presentDays: number;
  absentDays: number;
  totalDays: number;
  percentage: number;
  chronicAbsentee?: boolean;
}

interface AttendanceReportDto {
  from: string;
  to: string;
  rows: AttendanceReportRowDto[];
}

interface ClassDto {
  id: string;
  name: string;
}

const StudentAttendanceHistory = () => {
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [classId, setClassId] = useState("");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState("");
  const [report, setReport] = useState<AttendanceReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    fetchApi("/Classes")
      .then((list: ClassDto[]) => setClasses(Array.isArray(list) ? list : []))
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const from = new Date(fromDate + "T00:00:00").toISOString();
    const to = new Date(toDate + "T23:59:59").toISOString();
    const url = classId
      ? `/Reports/attendance?from=${from}&to=${to}&classId=${encodeURIComponent(classId)}`
      : `/Reports/attendance?from=${from}&to=${to}`;
    fetchApi(url)
      .then((d: AttendanceReportDto) => setReport(d))
      .catch((e: Error) => {
        setError(e.message || "Failed to load");
        setReport(null);
      })
      .finally(() => setLoading(false));
  }, [fromDate, toDate, classId]);

  const rows = report?.rows ?? [];
  const filteredRows = searchTerm
    ? rows.filter(
        (r) =>
          r.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rows;

  const content = (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Student Attendance History</h1>
          <p className="text-muted-foreground text-sm">Attendance summary for the selected period</p>
        </div>
        <Button variant="outline" className="rounded-xl gap-2 shadow-sm" onClick={() => setShowDownload(true)}>
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <Card className="rounded-[20px] shadow-sm border-border bg-card/50">
        <CardContent className="p-5 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">From</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl h-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">To</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl h-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Class</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-4 py-2 text-sm"
            >
              <option value="">All</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-muted-foreground">Search student</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 rounded-xl h-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="rounded-[20px] border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent></Card>
      ) : filteredRows.length === 0 ? (
        <Card className="rounded-[20px] shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center h-64">
            <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">No attendance records found</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">Adjust date range or class filter.</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[20px] shadow-card overflow-hidden border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-4 text-left font-semibold text-muted-foreground">Student</th>
                    <th className="px-6 py-4 text-left font-semibold text-muted-foreground">Class</th>
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">Present</th>
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">Absent</th>
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">Total</th>
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">%</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr key={r.studentId} className="border-b border-border/50 last:border-0 hover:bg-muted/10">
                      <td className="px-6 py-4 font-medium text-foreground">{r.studentName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{r.className ?? "—"}</td>
                      <td className="px-6 py-4 text-right">{r.presentDays}</td>
                      <td className="px-6 py-4 text-right">{r.absentDays}</td>
                      <td className="px-6 py-4 text-right">{r.totalDays}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={r.percentage >= 75 ? "text-success font-medium" : "text-destructive font-medium"}>
                          {r.percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      <DownloadModal
        open={showDownload}
        onClose={() => setShowDownload(false)}
        title="Student Attendance History"
        previewData={{
          headers: ["Student", "Class", "Present", "Absent", "Total", "%"],
          rows: filteredRows.map((r) => [r.studentName, r.className ?? "—", String(r.presentDays), String(r.absentDays), String(r.totalDays), r.percentage.toFixed(1) + "%"]),
        }}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <DashboardHeader />
      {content}
    </div>
  );
};

export default StudentAttendanceHistory;
