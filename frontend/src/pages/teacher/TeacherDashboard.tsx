import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatCard } from "@/components/StatCard";
import { Users, ClipboardCheck, BookOpen, DollarSign, Bell, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

interface TeacherTodaySlotDto {
  id: string;
  batchName: string;
  subject: string;
  room?: string;
  startTime: string;
  endTime: string;
}

interface AnnouncementDto {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
}

interface TeacherPortalDashboardDto {
  teacherName?: string;
  todaySlots: TeacherTodaySlotDto[];
  classesTodayCount: number;
  pendingAttendanceCount: number;
  currentSalaryAmount?: number;
  notices: AnnouncementDto[];
}

const TeacherDashboard = () => {
  const [data, setData] = useState<TeacherPortalDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/TeacherPortal/dashboard")
      .then((d: TeacherPortalDashboardDto) => setData(d))
      .catch((e: Error) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (start: string, end: string) => {
    if (!start && !end) return "—";
    return [start, end].filter(Boolean).join(" – ");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <DashboardHeader />
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-xl bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <DashboardHeader />
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-destructive">{error}</CardContent>
        </Card>
      </div>
    );
  }

  const d = data ?? { todaySlots: [], classesTodayCount: 0, pendingAttendanceCount: 0, notices: [] };
  const salary = d.currentSalaryAmount != null ? Math.round(d.currentSalaryAmount) : null;

  return (
    <div className="space-y-4">
      <DashboardHeader />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="gradient-hero rounded-[var(--radius)] p-8 text-primary-foreground">
          <h2 className="text-lg font-semibold">Welcome back, {d.teacherName ?? "Teacher"}!</h2>
          <p className="mt-1 text-primary-foreground/80">You have {d.classesTodayCount} class{d.classesTodayCount !== 1 ? "es" : ""} scheduled today</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Today's Classes" value={d.classesTodayCount} icon={BookOpen} color="gradient-primary" delay={0.2} />
          <StatCard title="Pending Attendance" value={d.pendingAttendanceCount} icon={ClipboardCheck} color="bg-warning" delay={0.25} />
          <StatCard title="Monthly Salary" value={salary ?? 0} prefix="₹" icon={DollarSign} color="bg-success" delay={0.3} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="rounded-[var(--radius)] shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {d.todaySlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No classes scheduled for today.</p>
                  ) : (
                    d.todaySlots.map((c, i) => (
                      <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-4 card-hover">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground text-sm font-bold">
                            {c.startTime || "—"}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{c.subject}</p>
                            <p className="text-xs text-muted-foreground">{c.batchName} {c.room ? `• ${c.room}` : ""}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {formatTime(c.startTime, c.endTime)}
                        </span>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="rounded-[var(--radius)] shadow-card h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {d.notices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No notices.</p>
                ) : (
                  d.notices.slice(0, 5).map((n) => (
                    <motion.div key={n.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-border p-3 card-hover cursor-pointer">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
    </div>
  );
};

export default TeacherDashboard;
