import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadModal } from "@/components/DownloadModal";
import { Download } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useTeacherCurrentBatch, batchDisplayName } from "@/context/TeacherCurrentBatchContext";
import { cn } from "@/lib/utils";

interface StudentDto {
  id: string;
  name: string;
  admissionNumber: string;
}

interface AttendanceRecordDto {
  studentId: string;
  status: string;
}

type AttendanceStatus = "Present" | "Absent" | "Late";
const ATTENDANCE_OPTIONS: AttendanceStatus[] = ["Present", "Absent", "Late"];

export default function TeacherBatchAttendance() {
  const batch = useTeacherCurrentBatch();
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusByStudent, setStatusByStudent] = useState<Record<string, AttendanceStatus | "">>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [hasExistingRecords, setHasExistingRecords] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;
  const statusButtonClass = (isSelected: boolean, status: AttendanceStatus) =>
    cn(
      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
      !isSelected && "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      isSelected &&
        (status === "Present"
          ? "border-green-300 bg-green-100 text-green-700"
          : status === "Absent"
            ? "border-red-300 bg-red-100 text-red-700"
            : "border-amber-300 bg-amber-100 text-amber-700"),
    );

  useEffect(() => {
    if (!batch.isClassTeacher) {
      setStudents([]);
      setStatusByStudent({});
      setHasExistingRecords(false);
      return;
    }
    setLoading(true);
    const dateObj = new Date(date + "T12:00:00").toISOString();
    Promise.all([
      fetchApi(`/Students?batchId=${encodeURIComponent(batch.id)}&status=Active&take=500`) as Promise<{
        items: StudentDto[];
      }>,
      fetchApi(`/Attendance/batch/${batch.id}?date=${dateObj}`) as Promise<AttendanceRecordDto[]>,
    ])
      .then(([res, att]) => {
        const list = res?.items ?? [];
        setStudents(list);
        const map: Record<string, string> = {};
        att.forEach((a) => {
          if (a.studentId) map[a.studentId] = a.status;
        });
        setHasExistingRecords(att.length > 0);
        list.forEach((s) => {
          if (!(s.id in map)) map[s.id] = "";
        });
        setStatusByStudent(map as Record<string, AttendanceStatus | "">);
      })
      .catch((e: Error) =>
        toast({ title: "Error", description: e.message || "Failed to load", variant: "destructive" }),
      )
      .finally(() => setLoading(false));
  }, [batch.id, batch.isClassTeacher, date]);

  const handleSubmit = async () => {
    if (!batch.isClassTeacher) return;
    const unselectedCount = students.filter((s) => !statusByStudent[s.id]).length;
    if (unselectedCount > 0) {
      toast({
        title: "Select attendance status",
        description: `Please select status for ${unselectedCount} student${unselectedCount > 1 ? "s" : ""}.`,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await fetchApi("/Attendance/bulk", {
        method: "POST",
        body: JSON.stringify({
          batchId: batch.id,
          date: new Date(date + "T12:00:00").toISOString(),
          items: students.map((s) => ({ studentId: s.id, status: statusByStudent[s.id] as AttendanceStatus })),
        }),
      });
      toast({ title: "Success", description: "Attendance saved." });
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Save failed", variant: "destructive" });
    }
    setSaving(false);
  };

  const displayName = batchDisplayName(batch);
  const isEditable = batch.isClassTeacher && !loading && isToday && !hasExistingRecords;

  if (!batch.isClassTeacher) {
    return (
      <Card className="rounded-[var(--radius)] border-muted">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Only the class teacher can mark attendance for this batch. You can still view the roster from the Roster tab.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 max-w-full break-words rounded-xl border border-input bg-muted/50 px-4 py-2 text-sm font-medium">{displayName}</span>
        <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm sm:w-auto"
          />
          <Button variant="outline" className="w-full gap-2 rounded-xl sm:w-auto" onClick={() => setShowDownload(true)}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-[var(--radius)] shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">
              {displayName} — {date}
            </CardTitle>
            {!isToday && (
              <p className="mt-1 text-sm text-muted-foreground">
                You can view attendance for any date, but only today&apos;s date can be marked.
              </p>
            )}
            {isToday && hasExistingRecords && (
              <p className="mt-1 text-sm text-muted-foreground">
                Attendance for today has already been submitted and can&apos;t be changed.
              </p>
            )}
            {isToday && !hasExistingRecords && (
              <p className="mt-1 text-sm text-muted-foreground">
                You can mark attendance for today. Once submitted, it can&apos;t be edited.
              </p>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-muted-foreground">Loading…</p>
            ) : (
              <>
                {students.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-border/60">
                    <table className="w-full min-w-[700px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admission #</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, i) => (
                          <motion.tr
                            key={s.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={cn("border-b border-border/40", i % 2 !== 0 && "bg-muted/10")}
                          >
                            <td className="px-4 py-3 font-medium text-foreground">{s.admissionNumber || "—"}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {ATTENDANCE_OPTIONS.map((status) => {
                                  const selected = statusByStudent[s.id] === status;
                                  return (
                                    <button
                                      key={status}
                                      type="button"
                                      disabled={!isEditable}
                                      onClick={() => {
                                        if (!isEditable) return;
                                        setStatusByStudent((p) => ({ ...p, [s.id]: status }));
                                      }}
                                      className={statusButtonClass(selected, status)}
                                    >
                                      <span className={cn("inline-block h-3.5 w-3.5 rounded-[3px] border", selected ? "border-current bg-current/15" : "border-slate-300")} />
                                      {status}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {students.length > 0 && (
                  <div className="mt-6 flex flex-col sm:flex-row sm:justify-end">
                    <Button
                      className="w-full rounded-xl px-8 gradient-primary text-primary-foreground sm:w-auto"
                      onClick={handleSubmit}
                      disabled={!isEditable || saving}
                    >
                      {saving ? "Saving…" : "Submit attendance"}
                    </Button>
                  </div>
                )}
                {!loading && students.length === 0 && (
                  <p className="py-4 text-muted-foreground">No active students in this batch.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <DownloadModal
        open={showDownload}
        onClose={() => setShowDownload(false)}
        title="Attendance sheet"
        previewData={{
          headers: ["Roll", "Name", "Status"],
          rows: students.map((s) => [s.admissionNumber || "—", s.name, statusByStudent[s.id] || "—"]),
        }}
      />
    </div>
  );
}
