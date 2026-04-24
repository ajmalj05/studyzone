import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchApi } from "@/lib/api";
import { Clock, Activity } from "lucide-react";

interface AttendanceReportDto {
  rows?: { className?: string; percentage?: number; studentName: string }[];
}

function groupByClass(rows: { className?: string; percentage?: number }[]) {
  const byClass: Record<string, { sum: number; count: number }> = {};
  rows.forEach((r) => {
    const name = r.className || "Other";
    if (!byClass[name]) byClass[name] = { sum: 0, count: 0 };
    byClass[name].sum += r.percentage ?? 0;
    byClass[name].count += 1;
  });
  return Object.entries(byClass).map(([name, v]) => ({
    name,
    attendance: v.count > 0 ? Math.round(v.sum / v.count) : 0,
  }));
}

interface AttendanceChartProps {
  academicYearId?: string;
}

export function AttendanceChart({ academicYearId }: AttendanceChartProps) {
  const [classes, setClasses] = useState<{ name: string; attendance: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 30);
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    if (academicYearId) params.set("academicYearId", academicYearId);
    fetchApi(`/Reports/attendance?${params.toString()}`)
      .then((d: AttendanceReportDto) => {
        const rows = d.rows ?? [];
        setClasses(groupByClass(rows).slice(0, 6));
      })
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, [academicYearId]);

  const averageAttendance = classes.length > 0 
    ? Math.round(classes.reduce((sum, c) => sum + c.attendance, 0) / classes.length)
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="border border-border/80 shadow-sm bg-card rounded-lg h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-base font-semibold">Attendance Overview</h3>
            <p className="text-xs text-muted-foreground">Last 30 days by class</p>
          </div>
        </div>

        {/* Average Stat */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Average Attendance</p>
            {loading ? (
              <div className="h-6 w-16 bg-muted rounded animate-pulse mt-1" />
            ) : (
              <p className="text-xl font-semibold">{averageAttendance}%</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-full bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <Activity className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">No attendance data</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((cls, index) => (
              <motion.div 
                key={cls.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                {/* Circular Progress */}
                <div className="relative w-12 h-12 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    {/* Progress circle */}
                    <motion.path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="hsl(189 95% 43%)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: `${cls.attendance}, 100` }}
                      transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-foreground">{cls.attendance}%</span>
                  </div>
                </div>

                {/* Class Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{cls.name}</p>
                    <span className="text-sm font-semibold text-muted-foreground">{cls.attendance}%</span>
                  </div>
                  {/* Linear Progress Bar */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cls.attendance}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}