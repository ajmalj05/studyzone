import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { Users, GraduationCap } from "lucide-react";

interface StudentDto {
  id: string;
  name: string;
  admissionNumber: string;
}

interface ClassDto {
  id: string;
  name: string;
}

interface AttendanceRecordDto {
  studentId: string;
  status: string;
}

interface TeacherAttendanceItemDto {
  teacherUserId: string;
  teacherName: string;
  subject?: string;
  status: string;
}

export default function Attendance() {
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [existing, setExisting] = useState<AttendanceRecordDto[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusByStudent, setStatusByStudent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Teacher attendance state
  const [teacherDate, setTeacherDate] = useState(new Date().toISOString().slice(0, 10));
  const [teachers, setTeachers] = useState<TeacherAttendanceItemDto[]>([]);
  const [statusByTeacher, setStatusByTeacher] = useState<Record<string, string>>({});
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherSaving, setTeacherSaving] = useState(false);

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch (_) {}
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      setExisting([]);
      setStatusByStudent({});
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = (await fetchApi(`/Students?classId=${encodeURIComponent(classId)}&status=Active&take=500`)) as { items: StudentDto[] };
        const list = res.items ?? [];
        setStudents(list);
        const dateObj = new Date(date + "T12:00:00");
        const att = (await fetchApi(`/Attendance/class/${classId}?date=${dateObj.toISOString()}`)) as AttendanceRecordDto[];
        setExisting(att);
        const map: Record<string, string> = {};
        att.forEach((a) => {
          if (a.studentId) map[a.studentId] = a.status;
        });
        list.forEach((s) => {
          if (!(s.id in map)) map[s.id] = "Present";
        });
        setStatusByStudent(map);
      } catch (e: unknown) {
        toast({ title: "Error", description: (e as Error).message || "Failed to load", variant: "destructive" });
      }
      setLoading(false);
    })();
  }, [classId, date]);

  const handleSave = async () => {
    if (!classId) return;
    setSaving(true);
    try {
      await fetchApi("/Attendance/bulk", {
        method: "POST",
        body: JSON.stringify({
          classId,
          date: new Date(date + "T12:00:00").toISOString(),
          items: students.map((s) => ({ studentId: s.id, status: statusByStudent[s.id] || "Present" })),
        }),
      });
      toast({ title: "Success", description: "Attendance saved." });
      const dateObj = new Date(date + "T12:00:00");
      const att = (await fetchApi(`/Attendance/class/${classId}?date=${dateObj.toISOString()}`)) as AttendanceRecordDto[];
      setExisting(att);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Save failed", variant: "destructive" });
    }
    setSaving(false);
  };

  const loadTeachersForDate = async () => {
    setTeacherLoading(true);
    try {
      const dateObj = new Date(teacherDate + "T12:00:00");
      const list = (await fetchApi(`/Attendance/teachers?date=${dateObj.toISOString()}`)) as TeacherAttendanceItemDto[];
      setTeachers(list);
      const map: Record<string, string> = {};
      list.forEach((t) => {
        map[t.teacherUserId] = t.status;
      });
      setStatusByTeacher(map);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load teachers", variant: "destructive" });
      setTeachers([]);
    }
    setTeacherLoading(false);
  };

  useEffect(() => {
    loadTeachersForDate();
  }, [teacherDate]);

  const handleSaveTeacherAttendance = async () => {
    setTeacherSaving(true);
    try {
      await fetchApi("/Attendance/bulk-teacher", {
        method: "POST",
        body: JSON.stringify({
          date: new Date(teacherDate + "T12:00:00").toISOString(),
          items: teachers.map((t) => ({ teacherUserId: t.teacherUserId, status: statusByTeacher[t.teacherUserId] || "Present" })),
        }),
      });
      toast({ title: "Success", description: "Teacher attendance saved." });
      loadTeachersForDate();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Save failed", variant: "destructive" });
    }
    setTeacherSaving(false);
  };

  return (
    <div className="space-y-4">
      <DashboardHeader title="Attendance" />
        <div className="space-y-4">
          <Tabs defaultValue="student" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="student" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Student
              </TabsTrigger>
              <TabsTrigger value="teacher" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Teacher
              </TabsTrigger>
            </TabsList>
            <TabsContent value="student" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mark student attendance</CardTitle>
                  <CardDescription>Select class and date, then mark Present / Absent / Late per student.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Class</label>
                      <Select value={classId} onValueChange={setClassId}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Date</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
                    </div>
                  </div>
                  {loading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {students.map((s) => (
                          <div key={s.id} className="flex items-center justify-between rounded-lg border px-4 py-2">
                            <span className="font-medium">{s.name}</span>
                            <div className="flex gap-2">
                              <Button size="sm" variant={statusByStudent[s.id] === "Present" ? "default" : "outline"} onClick={() => setStatusByStudent((p) => ({ ...p, [s.id]: "Present" }))}>Present</Button>
                              <Button size="sm" variant={statusByStudent[s.id] === "Absent" ? "destructive" : "outline"} onClick={() => setStatusByStudent((p) => ({ ...p, [s.id]: "Absent" }))}>Absent</Button>
                              <Button size="sm" variant={statusByStudent[s.id] === "Late" ? "secondary" : "outline"} onClick={() => setStatusByStudent((p) => ({ ...p, [s.id]: "Late" }))}>Late</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {students.length > 0 && (
                        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save attendance"}</Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="teacher" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mark teacher attendance</CardTitle>
                  <CardDescription>Select date and mark Present / Absent / Late per teacher.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Date</label>
                      <input type="date" value={teacherDate} onChange={(e) => setTeacherDate(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
                    </div>
                  </div>
                  {teacherLoading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {teachers.map((t) => (
                          <div key={t.teacherUserId} className="flex items-center justify-between rounded-lg border px-4 py-2">
                            <span className="font-medium">{t.teacherName}</span>
                            <div className="flex gap-2">
                              <Button size="sm" variant={statusByTeacher[t.teacherUserId] === "Present" ? "default" : "outline"} onClick={() => setStatusByTeacher((p) => ({ ...p, [t.teacherUserId]: "Present" }))}>Present</Button>
                              <Button size="sm" variant={statusByTeacher[t.teacherUserId] === "Absent" ? "destructive" : "outline"} onClick={() => setStatusByTeacher((p) => ({ ...p, [t.teacherUserId]: "Absent" }))}>Absent</Button>
                              <Button size="sm" variant={statusByTeacher[t.teacherUserId] === "Late" ? "secondary" : "outline"} onClick={() => setStatusByTeacher((p) => ({ ...p, [t.teacherUserId]: "Late" }))}>Late</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {teachers.length > 0 && (
                        <Button onClick={handleSaveTeacherAttendance} disabled={teacherSaving}>{teacherSaving ? "Saving..." : "Save teacher attendance"}</Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </div>
  );
}
