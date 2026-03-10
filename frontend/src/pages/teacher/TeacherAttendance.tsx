import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadModal } from "@/components/DownloadModal";
import { Download } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useMyBatch } from "@/context/TeacherBatchContext";

interface StudentDto {
  id: string;
  name: string;
  admissionNumber: string;
}

interface AttendanceRecordDto {
  studentId: string;
  status: string;
}

const TeacherAttendance = () => {
  const { myBatch, loading: myBatchLoading } = useMyBatch();
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusByStudent, setStatusByStudent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [hasExistingRecords, setHasExistingRecords] = useState(false);

  // My attendance (teacher self)
  const [selfDate, setSelfDate] = useState(new Date().toISOString().slice(0, 10));
  const [selfStatus, setSelfStatus] = useState<string>("Present");
  const [selfSaving, setSelfSaving] = useState(false);
  const [selfLoading, setSelfLoading] = useState(false);
  const [currentSelfStatus, setCurrentSelfStatus] = useState<string | null>(null);

  const effectiveBatchId = myBatch?.id ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;

  useEffect(() => {
    if (!effectiveBatchId) {
      setStudents([]);
      setStatusByStudent({});
      setHasExistingRecords(false);
      return;
    }
    setLoading(true);
    const dateObj = new Date(date + "T12:00:00").toISOString();
    Promise.all([
      fetchApi(`/Students?batchId=${encodeURIComponent(effectiveBatchId)}&status=Active&take=500`) as Promise<{
        items: StudentDto[];
      }>,
      fetchApi(`/Attendance/batch/${effectiveBatchId}?date=${dateObj}`) as Promise<AttendanceRecordDto[]>,
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
      .catch((e: Error) => toast({ title: "Error", description: e.message || "Failed to load", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [effectiveBatchId, date]);

  const handleSubmit = async () => {
    if (!effectiveBatchId) return;
    setSaving(true);
    try {
      await fetchApi("/Attendance/bulk", {
        method: "POST",
        body: JSON.stringify({
          batchId: effectiveBatchId,
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

  // Load current self-attendance for selfDate
  useEffect(() => {
    let cancelled = false;
    setSelfLoading(true);
    setCurrentSelfStatus(null);
    const from = new Date(selfDate + "T00:00:00").toISOString();
    const to = new Date(selfDate + "T23:59:59").toISOString();
    fetchApi("/Me")
      .then((me: { id: string }) => fetchApi(`/Attendance/teacher/${me.id}?from=${from}&to=${to}`) as Promise<{ date: string; status: string }[]>)
      .then((list) => {
        if (cancelled) return;
        const record = Array.isArray(list) && list.length > 0 ? list[0] : null;
        setCurrentSelfStatus(record?.status ?? null);
      })
      .catch(() => { if (!cancelled) setCurrentSelfStatus(null); })
      .finally(() => { if (!cancelled) setSelfLoading(false); });
    return () => { cancelled = true; };
  }, [selfDate]);

  const handleSaveSelfAttendance = async () => {
    setSelfSaving(true);
    try {
      await fetchApi("/Attendance/self", {
        method: "POST",
        body: JSON.stringify({
          date: new Date(selfDate + "T12:00:00").toISOString(),
          status: selfStatus,
        }),
      });
      setCurrentSelfStatus(selfStatus);
      toast({ title: "Success", description: "Your attendance has been recorded." });
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to save", variant: "destructive" });
    }
    setSelfSaving(false);
  };

  const batchDisplayName = myBatch ? `${myBatch.className} – ${myBatch.name}` : null;
  const isEditable = !!myBatch && !loading && isToday && !hasExistingRecords;

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">Mark Student Attendance</h1>
          <div className="flex gap-3 flex-wrap">
            {myBatchLoading ? (
              <span className="text-sm text-muted-foreground">Loading...</span>
            ) : myBatch ? (
              <span className="rounded-xl border border-input bg-muted/50 px-4 py-2 text-sm font-medium">
                My batch: {batchDisplayName}
              </span>
            ) : null}
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

        {!myBatchLoading && !myBatch && (
          <Card className="rounded-[var(--radius)] border-muted">
            <CardContent className="py-6">
              <p className="text-muted-foreground text-center">You are not assigned as class teacher. Only class teachers can mark student attendance. Please contact admin to assign you to a batch.</p>
            </CardContent>
          </Card>
        )}

        {myBatch && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[var(--radius)] shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">
                {batchDisplayName ? `${batchDisplayName} — ${date}` : "Student attendance"}
              </CardTitle>
              {!isToday && (
                <p className="text-sm text-muted-foreground mt-1">
                  You can view attendance for any date, but only today&apos;s date can be marked.
                </p>
              )}
              {isToday && hasExistingRecords && (
                <p className="text-sm text-muted-foreground mt-1">
                  Attendance for today has already been submitted and can&apos;t be changed.
                </p>
              )}
              {isToday && !hasExistingRecords && (
                <p className="text-sm text-muted-foreground mt-1">
                  You can mark attendance for today. Once submitted, it can&apos;t be edited.
                </p>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground py-4">Loading...</p>
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
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="grid grid-cols-[1.2fr_2fr_auto] items-center rounded-xl bg-muted/50 px-4 py-3 gap-3"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {s.admissionNumber || "—"}
                        </span>
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
                                ? "rounded-xl text-xs bg-success text-success-foreground hover:bg-success/90"
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
                        className="gradient-primary text-primary-foreground rounded-xl px-8"
                        onClick={handleSubmit}
                        disabled={!isEditable || saving}
                      >
                        {saving ? "Saving..." : "Submit Attendance"}
                      </Button>
                    </div>
                  )}
                  {effectiveBatchId && !loading && students.length === 0 && (
                    <p className="text-muted-foreground py-4">No active students in this batch.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-[var(--radius)] shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">My attendance</CardTitle>
              <p className="text-sm text-muted-foreground">Mark your own attendance for the day.</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <input
                    type="date"
                    value={selfDate}
                    onChange={(e) => setSelfDate(e.target.value)}
                    className="rounded-xl border border-input bg-background px-4 py-2 text-sm"
                  />
                </div>
                {selfLoading && <span className="text-sm text-muted-foreground">Loading...</span>}
                {!selfLoading && currentSelfStatus != null && (
                  <span className="text-sm text-muted-foreground">Recorded: <strong>{currentSelfStatus}</strong></span>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selfStatus === "Present" ? "default" : "outline"}
                    onClick={() => setSelfStatus("Present")}
                    className={selfStatus === "Present" ? "rounded-xl text-xs bg-success text-success-foreground hover:bg-success/90" : "rounded-xl text-xs"}
                  >
                    Present
                  </Button>
                  <Button
                    size="sm"
                    variant={selfStatus === "Absent" ? "destructive" : "outline"}
                    onClick={() => setSelfStatus("Absent")}
                    className="rounded-xl text-xs"
                  >
                    Absent
                  </Button>
                  <Button
                    size="sm"
                    variant={selfStatus === "Late" ? "secondary" : "outline"}
                    onClick={() => setSelfStatus("Late")}
                    className="rounded-xl text-xs"
                  >
                    Late
                  </Button>
                </div>
                <Button
                  className="gradient-primary text-primary-foreground rounded-xl"
                  onClick={handleSaveSelfAttendance}
                  disabled={selfSaving}
                >
                  {selfSaving ? "Saving..." : "Save my attendance"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      <DownloadModal
        open={showDownload}
        onClose={() => setShowDownload(false)}
        title="Attendance Sheet"
        previewData={{
          headers: ["Roll", "Name", "Status"],
          rows: students.map((s) => [
            s.admissionNumber || "—",
            s.name,
            statusByStudent[s.id] || "—",
          ]),
        }}
      />
    </div>
  );
};

export default TeacherAttendance;
