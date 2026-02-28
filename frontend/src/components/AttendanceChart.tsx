import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

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

export function AttendanceChart() {
  const [classes, setClasses] = useState<{ name: string; attendance: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 30);
    fetchApi(`/Reports/attendance?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((d: AttendanceReportDto) => {
        const rows = d.rows ?? [];
        setClasses(groupByClass(rows).slice(0, 8));
      })
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Attendance Overview</h3>
      <p className="text-xs text-muted-foreground">Last 30 days by class (avg %)</p>

      {loading ? (
        <div className="mt-3 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-2 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {classes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">No attendance data.</p>
          ) : (
            classes.map((cls) => (
              <div key={cls.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{cls.name}</span>
                  <span className="text-muted-foreground">{cls.attendance}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    style={{ width: `${Math.min(100, cls.attendance)}%` }}
                    className="h-full rounded-full gradient-primary transition-all duration-300"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
