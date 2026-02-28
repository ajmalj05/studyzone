import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchApi } from "@/lib/api";

interface ParentChildDto {
  studentId: string;
  name: string;
  className?: string;
}

interface TimetableSlotDto {
  id: string;
  batchName?: string;
  dayOfWeek: number;
  periodOrder: number;
  subject?: string;
  room?: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ParentTimetable = () => {
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("studentId");
  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [studentId, setStudentId] = useState(studentIdParam ?? "");
  const [slots, setSlots] = useState<TimetableSlotDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApi("/ParentPortal/my-children")
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setChildren(arr);
        if (!studentId && arr.length > 0) setStudentId(arr[0].studentId);
        if (studentIdParam && arr.some((c: ParentChildDto) => c.studentId === studentIdParam)) setStudentId(studentIdParam);
      })
      .catch(() => setChildren([]));
  }, [studentIdParam]);

  useEffect(() => {
    if (!studentId) {
      setSlots([]);
      return;
    }
    setLoading(true);
    fetchApi(`/ParentPortal/children/${studentId}/timetable`)
      .then((list) => setSlots(Array.isArray(list) ? list : []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  const byDay = slots.reduce((acc, s) => {
    const day = s.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {} as Record<number, TimetableSlotDto[]>);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Timetable</h1>
      <Card className="rounded-[var(--radius)]">
        <CardContent className="pt-6">
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="w-[280px] rounded-xl">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((c) => (
                <SelectItem key={c.studentId} value={c.studentId}>{c.name} {c.className ? `(${c.className})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {studentId && (
        <>
          {loading ? (
            <Card><CardContent className="p-8">Loading...</CardContent></Card>
          ) : slots.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((day) => {
                const daySlots = (byDay[day] ?? []).sort((a, b) => a.periodOrder - b.periodOrder);
                return (
                  <Card key={day} className="rounded-[var(--radius)]">
                    <CardHeader><CardTitle className="text-base">{DAYS[day] ?? `Day ${day}`}</CardTitle></CardHeader>
                    <CardContent>
                      {daySlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No classes</p>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {daySlots.map((s) => (
                            <li key={s.id} className="flex justify-between">
                              <span>P{s.periodOrder} {s.subject ?? "—"}</span>
                              <span className="text-muted-foreground">{s.room ?? ""}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card><CardContent className="p-8 text-muted-foreground">No timetable for this child.</CardContent></Card>
          )}
        </>
      )}
    </div>
  );
};

export default ParentTimetable;
