import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** Teacher marks their own attendance (not tied to a class batch). */
export function TeacherSelfAttendanceCard() {
  const [selfDate, setSelfDate] = useState(new Date().toISOString().slice(0, 10));
  const [selfStatus, setSelfStatus] = useState<"" | "Present" | "Absent" | "Late">("");
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
    if (!selfStatus) {
      toast({ title: "Validation", description: "Select attendance status", variant: "destructive" });
      return;
    }
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
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recorded</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Set Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/40">
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={selfDate}
                      onChange={(e) => setSelfDate(e.target.value)}
                      className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {selfLoading ? (
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    ) : (
                      <span className="text-sm font-medium text-foreground">{currentSelfStatus || "Not marked"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {(["Present", "Absent", "Late"] as const).map((status) => {
                        const selected = selfStatus === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setSelfStatus(status)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                              !selected && "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                              selected &&
                                (status === "Present"
                                  ? "border-green-300 bg-green-100 text-green-700"
                                  : status === "Absent"
                                    ? "border-red-300 bg-red-100 text-red-700"
                                    : "border-amber-300 bg-amber-100 text-amber-700"),
                            )}
                          >
                            <span className={cn("inline-block h-3.5 w-3.5 rounded-[3px] border", selected ? "border-current bg-current/15" : "border-slate-300")} />
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      className="gradient-primary text-primary-foreground rounded-xl"
                      onClick={handleSaveSelfAttendance}
                      disabled={selfSaving || !selfStatus}
                    >
                      {selfSaving ? "Saving..." : "Save my attendance"}
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
