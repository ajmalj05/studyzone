import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

/** Teacher marks their own attendance (not tied to a class batch). */
export function TeacherSelfAttendanceCard() {
  const [selfDate, setSelfDate] = useState(new Date().toISOString().slice(0, 10));
  const [selfStatus, setSelfStatus] = useState<string>("Present");
  const [selfSaving, setSelfSaving] = useState(false);
  const [selfLoading, setSelfLoading] = useState(false);
  const [currentSelfStatus, setCurrentSelfStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSelfLoading(true);
    setCurrentSelfStatus(null);
    const from = new Date(selfDate + "T00:00:00").toISOString();
    const to = new Date(selfDate + "T23:59:59").toISOString();
    fetchApi("/Me")
      .then((me: { id: string }) =>
        fetchApi(`/Attendance/teacher/${me.id}?from=${from}&to=${to}`) as Promise<{ date: string; status: string }[]>,
      )
      .then((list) => {
        if (cancelled) return;
        const record = Array.isArray(list) && list.length > 0 ? list[0] : null;
        setCurrentSelfStatus(record?.status ?? null);
      })
      .catch(() => {
        if (!cancelled) setCurrentSelfStatus(null);
      })
      .finally(() => {
        if (!cancelled) setSelfLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to save",
        variant: "destructive",
      });
    }
    setSelfSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
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
            {selfLoading && <span className="text-sm text-muted-foreground">Loading…</span>}
            {!selfLoading && currentSelfStatus != null && (
              <span className="text-sm text-muted-foreground">
                Recorded: <strong>{currentSelfStatus}</strong>
              </span>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={selfStatus === "Present" ? "default" : "outline"}
                onClick={() => setSelfStatus("Present")}
                className={
                  selfStatus === "Present"
                    ? "rounded-xl text-xs bg-success text-success-foreground hover:bg-success/90"
                    : "rounded-xl text-xs"
                }
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
              {selfSaving ? "Saving…" : "Save my attendance"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
