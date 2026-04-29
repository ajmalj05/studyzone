import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { fetchApi } from "@/lib/api";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";

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
const WORKING_DAYS = [1, 2, 3, 4, 5, 6];

const ParentTimetable = () => {
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("studentId");
  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [studentId, setStudentId] = useState(studentIdParam ?? "");
  const [slots, setSlots] = useState<TimetableSlotDto[]>([]);
  const [loading, setLoading] = useState(false);

  usePageHeaderConfigEffect(
    {
      title: "Timetable",
      description: "Weekly class schedule for each linked child.",
    },
    [],
  );

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
  const periodOrders = Array.from(new Set(slots.map((s) => s.periodOrder))).sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <Card className="rounded-[var(--radius)]">
        <CardContent className="pt-6">
          <SearchableSelect
            value={studentId}
            onValueChange={setStudentId}
            placeholder="Select child"
            className="w-full max-w-full sm:w-[280px] rounded-xl"
            options={children.map((c) => ({
              value: c.studentId,
              label: `${c.name}${c.className ? ` (${c.className})` : ""}`,
            }))}
          />
        </CardContent>
      </Card>
      {studentId && (
        <>
          {loading ? (
            <Card><CardContent className="p-8">Loading...</CardContent></Card>
          ) : slots.length > 0 ? (
            <Card className="rounded-[var(--radius)]">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-4 py-3 text-left font-semibold">Period</th>
                        {WORKING_DAYS.map((day) => (
                          <th key={day} className="px-4 py-3 text-left font-semibold">
                            {DAYS[day] ?? `Day ${day}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {periodOrders.map((period) => (
                        <tr key={period} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium text-foreground">P{period}</td>
                          {WORKING_DAYS.map((day) => {
                            const slot = (byDay[day] ?? []).find((s) => s.periodOrder === period);
                            return (
                              <td key={`${day}-${period}`} className="px-4 py-3 align-top">
                                {slot ? (
                                  <div className="space-y-0.5">
                                    <p className="font-medium text-foreground">{slot.subject ?? "—"}</p>
                                    {slot.room ? <p className="text-xs text-muted-foreground">{slot.room}</p> : null}
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
          ) : (
            <Card><CardContent className="p-8 text-muted-foreground">No timetable for this child.</CardContent></Card>
          )}
        </>
      )}
    </div>
  );
};

export default ParentTimetable;
