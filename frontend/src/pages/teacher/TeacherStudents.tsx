import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DownloadModal } from "@/components/DownloadModal";
import { Search, X, Eye, Download, History, Phone, Mail, User, Calendar } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fetchApi } from "@/lib/api";
import { useMyBatch } from "@/context/TeacherBatchContext";

interface StudentDto {
  id: string;
  admissionNumber: string;
  name: string;
  className?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

interface StudentRow {
  id: string;
  roll: string;
  name: string;
  class: string;
  attendance: string;
  grade: string;
}

const TeacherStudents = () => {
  const { myBatch, loading: myBatchLoading } = useMyBatch();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow & { detail?: StudentDto } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<{ date: string; status: string }[]>([]);
  const [showDownload, setShowDownload] = useState(false);
  const [modalDateFilter, setModalDateFilter] = useState("");
  const [modalMonthFilter, setModalMonthFilter] = useState("All");

  useEffect(() => {
    if (!myBatch) {
      (async () => {
        try {
          const list = (await fetchApi("/Classes")) as { id: string; name: string }[];
          setClasses(Array.isArray(list) ? list : []);
        } catch {
          setClasses([]);
        }
      })();
    }
  }, [myBatch]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (myBatch) {
      params.set("batchId", myBatch.id);
    } else if (classId) {
      params.set("classId", classId);
    }
    params.set("take", "200");
    fetchApi(`/Students?${params.toString()}`)
      .then((res: { items?: StudentDto[]; total?: number }) => {
        const items = res?.items ?? [];
        setStudents(
          items.map((s) => ({
            id: s.id,
            roll: s.admissionNumber ?? "—",
            name: s.name ?? "—",
            class: s.className ?? "—",
            attendance: "—",
            grade: "—",
          }))
        );
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [myBatch, classId]);

  const openDetail = async (row: StudentRow) => {
    setSelectedStudent({ ...row });
    setDetailLoading(true);
    setAttendanceHistory([]);
    try {
      const detail = (await fetchApi(`/Students/${row.id}`)) as StudentDto;
      setSelectedStudent((prev) => (prev ? { ...prev, detail } : null));
      const from = new Date();
      from.setMonth(from.getMonth() - 1);
      const to = new Date();
      try {
        const report = (await fetchApi(
          `/Reports/attendance?from=${from.toISOString()}&to=${to.toISOString()}`
        )) as { rows?: { studentId: string; studentName: string; presentDays: number; absentDays: number; totalDays: number }[] };
        const studentRow = report?.rows?.find((r: { studentId: string }) => r.studentId === row.id);
        if (studentRow && studentRow.totalDays > 0) {
          const pct = Math.round((studentRow.presentDays / studentRow.totalDays) * 1000) / 10;
          setAttendanceHistory([{ date: "Summary", status: `${studentRow.presentDays} present, ${studentRow.absentDays} absent (${pct}%)` }]);
        } else {
          setAttendanceHistory([{ date: "", status: "No attendance history for this period." }]);
        }
      } catch {
        setAttendanceHistory([{ date: "", status: "No attendance history for this period." }]);
      }
    } catch {
      setSelectedStudent((prev) => (prev ? { ...prev, detail: undefined } : null));
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Student List</h1>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowDownload(true)}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative max-w-md flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or roll number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
          {myBatchLoading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : myBatch ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">My batch</label>
              <span className="h-10 rounded-xl border border-input bg-muted/50 px-4 py-2 text-sm flex items-center">
                {myBatch.className} – {myBatch.name}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">Class</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-4 py-2 text-sm">
                <option value="">All</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[var(--radius)] shadow-card overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Roll</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Attendance</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Grade</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Action</th>
                    </tr></thead>
                    <tbody>
                      {filtered.map((s, i) => (
                        <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{s.roll}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{s.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{s.class}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{s.attendance}</td>
                          <td className="px-4 py-3"><span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{s.grade || "—"}</span></td>
                          <td className="px-4 py-3"><Button size="sm" variant="outline" className="rounded-xl" onClick={() => openDetail(s)}><Eye className="h-4 w-4" /></Button></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {selectedStudent && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
                onClick={() => setSelectedStudent(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-card rounded-[24px] shadow-2xl w-full max-w-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden"
              >
                <button onClick={() => setSelectedStudent(null)} className="absolute right-6 top-6 text-muted-foreground hover:text-foreground transition-colors bg-muted/50 rounded-full p-1 border border-border z-10">
                  <X className="h-4 w-4" />
                </button>

                <div className="p-6 sm:p-8 overflow-y-auto">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center border-b border-border/50 pb-4">
                    <div className="h-24 w-24 rounded-2xl gradient-primary flex items-center justify-center text-white text-4xl font-bold shadow-glow flex-shrink-0">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-foreground">{selectedStudent.name}</h2>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-secondary/50 text-secondary-foreground border border-border">
                          Roll: {selectedStudent.roll}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                          {selectedStudent.class}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/20">
                          Grade: {selectedStudent.grade || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="text-center bg-muted/30 p-4 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Attendance</p>
                      <p className="text-lg font-semibold text-primary">{selectedStudent.attendance}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><Phone className="h-4 w-4 text-muted-foreground" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Guardian Phone</p>
                        <p className="text-sm font-medium">{detailLoading ? "..." : (selectedStudent.detail?.guardianPhone ?? "—")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Guardian Email</p>
                        <p className="text-sm font-medium">{detailLoading ? "..." : (selectedStudent.detail?.guardianEmail ?? "—")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><User className="h-4 w-4 text-muted-foreground" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Guardian Name</p>
                        <p className="text-sm font-medium">{detailLoading ? "..." : (selectedStudent.detail?.guardianName ?? "—")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                      <History className="h-5 w-5 text-primary" /> Attendance
                    </h3>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/30 border-b border-border">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceHistory.length === 0 && !detailLoading ? (
                            <tr><td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">No attendance history for this period.</td></tr>
                          ) : (
                            attendanceHistory.map((record, idx) => (
                              <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/10">
                                <td className="px-4 py-3 text-foreground font-medium flex items-center gap-2">
                                  {record.date && record.date !== "Summary" ? <><Calendar className="h-4 w-4 text-muted-foreground" />{format(new Date(record.date), "MMM dd, yyyy")}</> : record.date || "—"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-foreground">
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      <DownloadModal open={showDownload} onClose={() => setShowDownload(false)} title="Student List" previewData={{ headers: ["Roll", "Name", "Class", "Grade"], rows: filtered.map(s => [s.roll, s.name, s.class, s.grade]) }} />
    </div>
  );
};

export default TeacherStudents;
