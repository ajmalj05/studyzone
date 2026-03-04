import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadModal } from "@/components/DownloadModal";
import { Calendar, Download, Clock } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface TimetableSlotDto {
  id: string;
  batchId: string;
  batchName: string;
  dayOfWeek: number;
  periodOrder: number;
  subject: string;
  room?: string;
  teacherUserId?: string;
  teacherName?: string;
  isPublished: boolean;
}

interface TimetableSettingsDto {
  workingDayCount: number;
  periodsPerDay: number;
}

interface PeriodConfigDto {
  id: string;
  dayOfWeek: number;
  periodOrder: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  label?: string;
}

const DAY_NAMES: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

const TeacherTimetable = () => {
  const [slots, setSlots] = useState<TimetableSlotDto[]>([]);
  const [settings, setSettings] = useState<TimetableSettingsDto | null>(null);
  const [periodConfigs, setPeriodConfigs] = useState<PeriodConfigDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchApi("/TeacherPortal/timetable") as Promise<TimetableSlotDto[]>,
      fetchApi("/Timetable/settings").catch(() => ({ workingDayCount: 5, periodsPerDay: 6 })) as Promise<TimetableSettingsDto>,
      fetchApi("/Timetable/period-config").catch(() => []) as Promise<PeriodConfigDto[]>,
    ])
      .then(([list, s, periods]) => {
        setSlots(Array.isArray(list) ? list : []);
        setSettings(s);
        setPeriodConfigs(Array.isArray(periods) ? periods.filter((p: PeriodConfigDto) => !p.isBreak) : []);
      })
      .catch((e: Error) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const getSlot = (dayOfWeek: number, periodOrder: number) =>
    slots.find((s) => s.dayOfWeek === dayOfWeek && s.periodOrder === periodOrder);

  const getTimeForSlot = (dayOfWeek: number, periodOrder: number) => {
    const p = periodConfigs.find((c) => c.dayOfWeek === dayOfWeek && c.periodOrder === periodOrder);
    if (p) return `${p.startTime} – ${p.endTime}`;
    return null;
  };

  const workingDayCount = settings?.workingDayCount ?? 5;
  const periodsPerDay = settings?.periodsPerDay ?? 6;
  const daysInUse = Array.from({ length: workingDayCount }, (_, i) => i + 1);
  const periodOrders = Array.from({ length: periodsPerDay }, (_, i) => i + 1);

  const todayDayOfWeek = new Date().getDay();
  const todaySlots = slots
    .filter((s) => s.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => a.periodOrder - b.periodOrder);

  const byDay = slots.reduce<Record<number, TimetableSlotDto[]>>((acc, s) => {
    const d = s.dayOfWeek;
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});

  const rows = Object.keys(byDay)
    .map(Number)
    .sort((a, b) => a - b)
    .map((day) => ({
      day,
      dayName: DAY_NAMES[day] ?? `Day ${day}`,
      periods: byDay[day].sort((a, b) => a.periodOrder - b.periodOrder),
    }));

  const flatRows = rows.flatMap((r) =>
    r.periods.map((p) => [
      r.dayName,
      p.periodOrder.toString(),
      p.subject,
      p.batchName,
      p.room ?? "—",
    ])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-foreground">My Timetable</h1>
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowDownload(true)}>
          <Download className="h-4 w-4" /> Download Timetable
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-destructive">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && slots.length > 0 && todaySlots.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[var(--radius)] shadow-card border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Next — Today ({DAY_NAMES[todayDayOfWeek] ?? "Today"})
              </CardTitle>
              <p className="text-sm text-muted-foreground">Your classes for today</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todaySlots.map((p) => {
                  const time = getTimeForSlot(p.dayOfWeek, p.periodOrder);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-muted-foreground">
                        Period {p.periodOrder}
                        {time && (
                          <span className="ml-2 text-xs font-normal">({time})</span>
                        )}
                      </span>
                      <div className="flex-1 mx-4 text-center">
                        <p className="font-medium text-foreground">{p.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.batchName} {p.room ? `• ${p.room}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!loading && !error && slots.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No timetable slots assigned.
          </CardContent>
        </Card>
      )}

      {!loading && !error && slots.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[var(--radius)] shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Weekly timetable
              </CardTitle>
              <p className="text-sm text-muted-foreground">Your classes by day and period</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border border-border p-2 bg-muted/50 w-14 font-medium">
                        Period
                      </th>
                      {daysInUse.map((d) => (
                        <th key={d} className="border border-border p-2 bg-muted/50 font-medium">
                          {DAY_NAMES[d] ?? `Day ${d}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periodOrders.map((po) => (
                      <tr key={po}>
                        <td className="border border-border p-2 font-medium">{po}</td>
                        {daysInUse.map((d) => {
                          const slot = getSlot(d, po);
                          return (
                            <td
                              key={`${d}-${po}`}
                              className="border border-border p-2 min-w-[120px] align-top"
                            >
                              {slot ? (
                                <div className="text-xs">
                                  <div className="font-medium">{slot.subject}</div>
                                  <div className="text-muted-foreground">{slot.batchName}</div>
                                  {slot.room && (
                                    <div className="text-muted-foreground">{slot.room}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <DownloadModal
        open={showDownload}
        onClose={() => setShowDownload(false)}
        title="My Timetable"
        previewData={{
          headers: ["Day", "Period", "Subject", "Batch", "Room"],
          rows: flatRows,
        }}
      />
    </div>
  );
};

export default TeacherTimetable;
