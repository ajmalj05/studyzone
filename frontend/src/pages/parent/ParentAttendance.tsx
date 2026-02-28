import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchApi } from "@/lib/api";

interface ParentChildDto {
  studentId: string;
  name: string;
  className?: string;
}

interface AttendanceRecordDto {
  id: string;
  date: string;
  status: string;
  recordType?: string;
}

const ParentAttendance = () => {
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("studentId");
  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [studentId, setStudentId] = useState(studentIdParam ?? "");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<AttendanceRecordDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApi("/ParentPortal/my-children")
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setChildren(arr);
        if (!studentId && arr.length > 0) setStudentId(arr[0].studentId);
        if (studentIdParam && arr.some((c: ParentChildDto) => c.studentId === studentIdParam)) setStudentId(studentIdParam);
      })
      .catch(() => setChildren([]));
  }, [studentIdParam]);

  useEffect(() => {
    if (!studentId) {
      setRecords([]);
      return;
    }
    setLoading(true);
    const fromIso = new Date(from + "T00:00:00").toISOString();
    const toIso = new Date(to + "T23:59:59").toISOString();
    fetchApi(`/ParentPortal/children/${studentId}/attendance?from=${fromIso}&to=${toIso}`)
      .then((list) => setRecords(Array.isArray(list) ? list : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [studentId, from, to]);

  const present = records.filter((r) => r.status === "Present" || r.status === "Late").length;
  const absent = records.filter((r) => r.status === "Absent").length;
  const total = present + absent;
  const percent = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Attendance</h1>
      <Card className="rounded-[var(--radius)] shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Select child and date range</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="w-[220px] rounded-xl">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((c) => (
                <SelectItem key={c.studentId} value={c.studentId}>{c.name} {c.className ? `(${c.className})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-input bg-background px-4 py-2 text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-input bg-background px-4 py-2 text-sm" />
        </CardContent>
      </Card>
      {studentId && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[var(--radius)] shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
              <p className="text-sm text-muted-foreground">Present: {present} | Absent: {absent} | Attendance: {percent}%</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : records.length === 0 ? (
                <p className="text-muted-foreground">No attendance records in this range.</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-auto">
                  {records.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2 text-sm">
                      <span>{new Date(r.date).toLocaleDateString()}</span>
                      <span className={r.status === "Absent" ? "text-destructive font-medium" : "text-success"}>{r.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ParentAttendance;
