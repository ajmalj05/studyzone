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
import { useTeacherCurrentBatch, batchDisplayName } from "@/context/TeacherCurrentBatchContext";

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

export default function TeacherBatchRoster() {
  const batch = useTeacherCurrentBatch();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<(StudentRow & { detail?: StudentDto }) | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<{ date: string; status: string }[]>([]);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("batchId", batch.id);
    params.set("take", "200");
    fetchApi(`/Students?${params.toString()}`)
      .then((res: { items?: StudentDto[] }) => {
        const items = res?.items ?? [];
        setStudents(
          items.map((s) => ({
            id: s.id,
            roll: s.admissionNumber ?? "—",
            name: s.name ?? "—",
            class: s.className ?? "—",
            attendance: "—",
            grade: "—",
          })),
        );
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [batch.id]);

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
          `/Reports/attendance?from=${from.toISOString()}&to=${to.toISOString()}`,
        )) as {
          rows?: { studentId: string; studentName: string; presentDays: number; absentDays: number; totalDays: number }[];
        };
        const studentRow = report?.rows?.find((r: { studentId: string }) => r.studentId === row.id);
        if (studentRow && studentRow.totalDays > 0) {
          const pct = Math.round((studentRow.presentDays / studentRow.totalDays) * 1000) / 10;
          setAttendanceHistory([
            {
              date: "Summary",
              status: `${studentRow.presentDays} present, ${studentRow.absentDays} absent (${pct}%)`,
            },
          ]);
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
      s.roll.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground min-w-0">
          Batch: <span className="font-medium text-foreground break-words">{batchDisplayName(batch)}</span>
        </p>
        <Button variant="outline" className="w-full rounded-xl gap-2 sm:w-auto shrink-0" onClick={() => setShowDownload(true)}>
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <div className="relative w-full max-w-md min-w-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or roll number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl pl-10"
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden rounded-[var(--radius)] shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Roll</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Attendance</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Grade</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{s.roll}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{s.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.class}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.attendance}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {s.grade || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openDetail(s)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">No students match your search.</p>
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
              className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="absolute right-6 top-6 z-10 rounded-full border border-border bg-muted/50 p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="overflow-y-auto p-6 sm:p-8">
                <div className="flex flex-col items-start gap-4 border-b border-border/50 pb-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl text-4xl font-bold text-white shadow-glow gradient-primary">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">{selectedStudent.name}</h2>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <span className="inline-flex items-center rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                        Roll: {selectedStudent.roll}
                      </span>
                      <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {selectedStudent.class}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-success/20 bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                        Grade: {selectedStudent.grade || "—"}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendance</p>
                    <p className="text-lg font-semibold text-primary">{selectedStudent.attendance}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-b border-border/50 py-6 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Guardian Phone</p>
                      <p className="text-sm font-medium">
                        {detailLoading ? "…" : (selectedStudent.detail?.guardianPhone ?? "—")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Guardian Email</p>
                      <p className="text-sm font-medium">
                        {detailLoading ? "…" : (selectedStudent.detail?.guardianEmail ?? "—")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Guardian Name</p>
                      <p className="text-sm font-medium">
                        {detailLoading ? "…" : (selectedStudent.detail?.guardianName ?? "—")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                    <History className="h-5 w-5 text-primary" /> Attendance
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceHistory.length === 0 && !detailLoading ? (
                          <tr>
                            <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                              No attendance history for this period.
                            </td>
                          </tr>
                        ) : (
                          attendanceHistory.map((record, idx) => (
                            <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/10">
                              <td className="flex items-center gap-2 px-4 py-3 font-medium text-foreground">
                                {record.date && record.date !== "Summary" ? (
                                  <>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(record.date), "MMM dd, yyyy")}
                                  </>
                                ) : (
                                  record.date || "—"
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-foreground">
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

      <DownloadModal
        open={showDownload}
        onClose={() => setShowDownload(false)}
        title="Student list"
        previewData={{
          headers: ["Roll", "Name", "Class", "Grade"],
          rows: filtered.map((s) => [s.roll, s.name, s.class, s.grade]),
        }}
      />
    </div>
  );
}
