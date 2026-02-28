import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadModal } from "@/components/DownloadModal";
import { Calendar, Download } from "lucide-react";
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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TeacherTimetable = () => {
  const [slots, setSlots] = useState<TimetableSlotDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    fetchApi("/TeacherPortal/timetable")
      .then((list: TimetableSlotDto[]) => setSlots(Array.isArray(list) ? list : []))
      .catch((e: Error) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

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

  const flatRows = rows.flatMap((r) => r.periods.map((p) => [r.dayName, p.periodOrder.toString(), p.subject, p.batchName, p.room ?? "—"]));

  return (
    <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-foreground">My Timetable</h1>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowDownload(true)}>
            <Download className="h-4 w-4" /> Download Timetable
          </Button>
        </div>

        {loading && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent></Card>
        )}

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        {!loading && !error && slots.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No timetable slots assigned.</CardContent></Card>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="space-y-4">
            {rows.map(({ day, dayName, periods }) => (
              <motion.div key={day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="rounded-[var(--radius)] shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" /> {dayName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {periods.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                          <span className="text-sm font-medium text-muted-foreground">Period {p.periodOrder}</span>
                          <div className="flex-1 mx-4 text-center">
                            <p className="font-medium text-foreground">{p.subject}</p>
                            <p className="text-xs text-muted-foreground">{p.batchName} {p.room ? `• ${p.room}` : ""}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
