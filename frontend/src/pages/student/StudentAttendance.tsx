import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadModal } from "@/components/DownloadModal";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { fetchApi } from "@/lib/api";
import { getStudentMenu } from "@/config/studentMenu";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
}

const StudentAttendance = () => {
  const [showDownload, setShowDownload] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  useEffect(() => {
    const from = new Date(month.year, month.month - 1, 1);
    const to = new Date(month.year, month.month, 0);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    (async () => {
      try {
        const list = (await fetchApi(`/Portal/attendance?from=${fromStr}&to=${toStr}`)) as { date: string; status: string; id?: string }[];
        setRecords(Array.isArray(list) ? list.map((r) => ({ id: r.id ?? r.date, date: typeof r.date === "string" ? r.date.slice(0, 10) : r.date, status: r.status })) : []);
      } catch (_) {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [month.year, month.month]);

  const presentDates = records.filter((r) => r.status === "Present" || r.status === "Late").map((r) => new Date(r.date));
  const absentDates = records.filter((r) => r.status === "Absent").map((r) => new Date(r.date));
  const totalDays = records.length;
  const presentDays = presentDates.length;
  const absentDays = absentDates.length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 0;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">My Attendance</h1>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowDownload(true)}>
            <Download className="h-4 w-4" /> Download Report
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Days", value: String(totalDays), icon: CalendarIcon },
            { label: "Present", value: String(presentDays), icon: ClipboardCheck },
            { label: "Percentage", value: `${percentage}%`, icon: ClipboardCheck },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="rounded-[20px] shadow-card card-hover border-border bg-card">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-sm">
                    <s.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-semibold text-foreground">{loading ? "—" : s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-[20px] shadow-card border-border bg-card overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" /> Attendance Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex justify-center">
                <Calendar
                  mode="multiple"
                  selected={presentDates}
                  modifiers={{
                    present: presentDates,
                    absent: absentDates,
                  }}
                  modifiersStyles={{
                    present: {
                      backgroundColor: "hsl(var(--success) / 0.15)",
                      color: "hsl(var(--success))",
                      fontWeight: "bold",
                    },
                    absent: {
                      backgroundColor: "hsl(var(--destructive) / 0.15)",
                      color: "hsl(var(--destructive))",
                      fontWeight: "bold",
                    },
                  }}
                  className="rounded-xl border border-border shadow-sm p-4 w-full flex justify-center scale-100 sm:scale-110 sm:my-4"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="rounded-[20px] shadow-card border-border bg-card h-full flex flex-col">
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <CardTitle className="text-lg font-bold">Recent Records</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                <div className="divide-y divide-border">
                  {(loading ? [] : records.slice(0, 10)).map((d, i) => (
                    <motion.div key={d.id || d.date} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.04 }} className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${d.status === "Present" || d.status === "Late" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          <CalendarIcon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{d.date}</span>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${d.status === "Present" || d.status === "Late" ? "bg-success/15 text-success border border-success/20" : "bg-destructive/15 text-destructive border border-destructive/20"}`}>{d.status}</span>
                    </motion.div>
                  ))}
                  {!loading && records.length === 0 && (
                    <p className="px-6 py-8 text-sm text-muted-foreground">No attendance records for this period.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

      <DownloadModal open={showDownload} onClose={() => setShowDownload(false)} title="Attendance Report" formats={["pdf"]} previewData={{ headers: ["Date", "Status"], rows: records.map((d) => [d.date, d.status]) }} />
    </div>
  );
};

export default StudentAttendance;
