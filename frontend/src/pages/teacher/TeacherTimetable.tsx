import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Coffee, Download, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { buildTimetablePdfHtml } from "@/lib/timetablePdf";
import type { SchoolProfileForReceipt } from "@/lib/receiptHtml";

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

interface TimetableBreakDto {
  id: string;
  afterPeriod: number;
  durationMinutes: number;
  appliesTo: string;
}

interface TimetableSettingsDto {
  workingDayCount: number;
  periodsPerDay: number;
  schoolStartTime?: string;
  periodDurationMinutes?: number;
  breaks?: TimetableBreakDto[];
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

interface TimeBlock {
  type: "period" | "break";
  periodOrder?: number;
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  appliesTo?: string;
}

const DAYS: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

const PX_PER_MIN = 2;

function fmtMin(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function buildTimeline(settings: TimetableSettingsDto): TimeBlock[] {
  const [startH, startM] = (settings.schoolStartTime || "08:00").split(":").map(Number);
  let cur = startH * 60 + startM;
  const dur = settings.periodDurationMinutes || 45;
  const breaks = settings.breaks || [];
  const blocks: TimeBlock[] = [];

  for (let p = 1; p <= settings.periodsPerDay; p++) {
    const s = cur;
    const e = cur + dur;
    blocks.push({ type: "period", periodOrder: p, startMinutes: s, endMinutes: e, startTime: fmtMin(s), endTime: fmtMin(e), durationMinutes: dur });
    cur = e;
    const brk = breaks.find((b) => b.afterPeriod === p);
    if (brk) {
      const be = cur + brk.durationMinutes;
      blocks.push({ type: "break", startMinutes: cur, endMinutes: be, startTime: fmtMin(cur), endTime: fmtMin(be), durationMinutes: brk.durationMinutes, appliesTo: brk.appliesTo });
      cur = be;
    }
  }
  return blocks;
}

const TeacherTimetable = () => {
  const [slots, setSlots] = useState<TimetableSlotDto[]>([]);
  const [settings, setSettings] = useState<TimetableSettingsDto | null>(null);
  const [periodConfigs, setPeriodConfigs] = useState<PeriodConfigDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const school = await fetchApi("/SchoolProfile").catch(() => null) as SchoolProfileForReceipt | null;
      const teacherName = slots.find((s) => s.teacherName)?.teacherName ?? "Teacher";
      const html = buildTimetablePdfHtml(timeline, slots, daysInUse, teacherName, school);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 6000);
    } finally {
      setDownloading(false);
    }
  };

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
  const daysInUse = Array.from({ length: workingDayCount }, (_, i) => i + 1);

  const timeline = settings ? buildTimeline(settings) : [];

  const todayDayOfWeek = new Date().getDay();
  const todaySlots = slots
    .filter((s) => s.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => a.periodOrder - b.periodOrder);

  return (
    <div className="space-y-4">
      {loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-destructive">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && todaySlots.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[var(--radius)] shadow-card border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Today — {DAYS[todayDayOfWeek] ?? "Today"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Your classes for today</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todaySlots.map((p) => {
                  const time = getTimeForSlot(p.dayOfWeek, p.periodOrder);
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Period {p.periodOrder}
                        {time && <span className="ml-2 text-xs font-normal">({time})</span>}
                      </span>
                      <div className="flex-1 mx-4 text-center">
                        <p className="font-medium text-foreground">{p.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.batchName}{p.room ? ` · ${p.room}` : ""}
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
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base flex items-center gap-2 min-w-0">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                  Weekly timetable
                </CardTitle>
                <Button variant="outline" size="sm" className="rounded-xl gap-2 w-full sm:w-auto shrink-0" onClick={handleDownload} disabled={downloading || slots.length === 0}>
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {downloading ? "Preparing…" : "Download timetable"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {timeline.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                  Timetable settings not configured yet.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/50">
                  <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
                    <table className="w-full min-w-[560px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-muted/40">
                          <th className="border-b border-border/60 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">
                            Time
                          </th>
                          {daysInUse.map((d) => (
                            <th
                              key={d}
                              className="border-b border-border/60 px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground min-w-[8rem]"
                            >
                              {DAYS[d]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeline.map((block, i) => {
                          const rowH = block.durationMinutes * PX_PER_MIN;

                          if (block.type === "break") {
                            return (
                              <tr key={i}>
                                <td
                                  className="border-b border-border/40 px-3 text-[10px] tabular-nums text-amber-700/70 dark:text-amber-400/70 align-middle"
                                  style={{ height: `${rowH}px` }}
                                >
                                  {block.startTime}
                                </td>
                                <td
                                  colSpan={daysInUse.length}
                                  className="border-b border-border/40 bg-amber-50/60 dark:bg-amber-900/10 px-4 align-middle text-center"
                                  style={{ height: `${rowH}px` }}
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <Coffee className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                      Break &middot; {block.durationMinutes} min &middot; {block.startTime} – {block.endTime}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={i}>
                              <td
                                className="border-b border-border/40 px-3 align-top"
                                style={{ height: `${rowH}px`, paddingTop: "10px" }}
                              >
                                <div className="text-xs font-semibold text-muted-foreground">
                                  P{block.periodOrder}
                                </div>
                                <div className="mt-0.5 text-[10px] tabular-nums leading-tight text-muted-foreground/70">
                                  {block.startTime}
                                </div>
                                <div className="text-[10px] tabular-nums leading-tight text-muted-foreground/50">
                                  –{block.endTime}
                                </div>
                              </td>
                              {daysInUse.map((d) => {
                                const slot = getSlot(d, block.periodOrder!);
                                return (
                                  <td
                                    key={`${d}-${block.periodOrder}`}
                                    className="border-b border-border/40 border-l border-l-border/20 px-2 py-2 align-top"
                                    style={{ height: `${rowH}px` }}
                                  >
                                    {slot ? (
                                      <div className="h-full rounded-lg border border-primary/15 bg-primary/8 px-2.5 py-2 text-xs leading-snug shadow-sm">
                                        <div className="font-semibold text-foreground">{slot.subject}</div>
                                        <div className="mt-0.5 text-muted-foreground">{slot.batchName}</div>
                                        {slot.room && (
                                          <div className="mt-0.5 text-[10px] text-muted-foreground/70">{slot.room}</div>
                                        )}
                                      </div>
                                    ) : null}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

    </div>
  );
};

export default TeacherTimetable;
