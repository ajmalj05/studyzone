import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadModal } from "@/components/DownloadModal";
import { Download } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useTeacherCurrentBatch, batchDisplayName } from "@/context/TeacherCurrentBatchContext";

interface StudentDto {
  id: string;
  name: string;
  admissionNumber: string;
}

interface AttendanceRecordDto {
  studentId: string;
  status: string;
}

export default function TeacherBatchAttendance() {
  const batch = useTeacherCurrentBatch();
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusByStudent, setStatusByStudent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [hasExistingRecords, setHasExistingRecords] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;

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
          if (!(s.id in map)) map[s.id] = "Present";
        });
        setStatusByStudent(map);
      })
      .catch((e: Error) =>
        toast({ title: "Error", description: e.message || "Failed to load", variant: "destructive" }),
      )
      .finally(() => setLoading(false));
  }, [batch.id, batch.isClassTeacher, date]);

  const handleSubmit = async () => {
    if (!batch.isClassTeacher) return;
    setSaving(true);
    try {
      await fetchApi("/Attendance/bulk", {
        method: "POST",
        body: JSON.stringify({
          batchId: batch.id,
          date: new Date(date + "T12:00:00").toISOString(),
          items: students.map((s) => ({ studentId: s.id, status: statusByStudent[s.id] || "Present" })),
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
      <div className="flex flex-col items-start justify-end gap-3 sm:flex-row sm:items-center">
        <span className="rounded-xl border border-input bg-muted/50 px-4 py-2 text-sm font-medium">{displayName}</span>
        <div className="flex flex-wrap gap-3 sm:ml-auto">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-input bg-background px-4 py-2 text-sm"
          />
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowDownload(true)}>
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
                <div className="space-y-3">
                  {students.length > 0 && (
                    <div className="grid grid-cols-[1.2fr_2fr_auto] items-center px-4 py-2 text-xs font-medium text-muted-foreground">
                      <span>Student ID</span>
                      <span>Student Name</span>
                      <span className="text-center">Status</span>
                    </div>
                  )}
                  {students.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="grid grid-cols-[1.2fr_2fr_auto] items-center gap-3 rounded-xl bg-muted/50 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-foreground">{s.admissionNumber || "—"}</span>
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={!isEditable}
                          variant={statusByStudent[s.id] === "Present" ? "default" : "outline"}
                          onClick={() => {
                            if (!isEditable) return;
                            setStatusByStudent((p) => ({ ...p, [s.id]: "Present" }));
                          }}
                          className={
                            statusByStudent[s.id] === "Present"
                              ? "rounded-xl bg-success text-xs text-success-foreground hover:bg-success/90"
                              : "rounded-xl text-xs"
                          }
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          disabled={!isEditable}
                          variant={statusByStudent[s.id] === "Absent" ? "destructive" : "outline"}
                          onClick={() => {
                            if (!isEditable) return;
                            setStatusByStudent((p) => ({ ...p, [s.id]: "Absent" }));
                          }}
                          className="rounded-xl text-xs"
                        >
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          disabled={!isEditable}
                          variant={statusByStudent[s.id] === "Late" ? "secondary" : "outline"}
                          onClick={() => {
                            if (!isEditable) return;
                            setStatusByStudent((p) => ({ ...p, [s.id]: "Late" }));
                          }}
                          className="rounded-xl text-xs"
                        >
                          Late
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {students.length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      className="gradient-primary rounded-xl px-8 text-primary-foreground"
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
