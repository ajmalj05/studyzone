import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";
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
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                  <div>
                    <CardTitle>Mark student attendance</CardTitle>
                    <CardDescription>Select class and date, then mark Present / Absent / Late per student.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Class</label>
                      <SearchableSelect
                        value={classId}
                        onValueChange={setClassId}
                        placeholder="Select class"
                        className="w-[180px]"
                        options={classes.map((c) => ({ value: c.id, label: c.name }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Date</label>
                      <DatePicker value={date} onChange={setDate} placeholder="Select date" className="w-[180px]" />
                    </div>
                    {students.length > 0 && (
                      <Button onClick={handleSave} disabled={saving} className="mb-0.5">{saving ? "Saving..." : "Save"}</Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : (
                    <>

                      {/* Beautiful Table */}
                      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800/50 border-b border-border/60">
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Student</th>
                                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {students.map((s) => (
                                <tr key={s.id} className="border-b border-border/30 last:border-0 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                  <td className="px-4 py-3">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{s.name}</span>
                                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-mono">{s.admissionNumber}</span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setStatusByStudent((p) => ({ ...p, [s.id]: "Present" }))}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                          statusByStudent[s.id] === "Present" 
                                            ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                        }`}
                                      >
                                        Present
                                      </button>
                                      <button
                                        onClick={() => setStatusByStudent((p) => ({ ...p, [s.id]: "Absent" }))}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                          statusByStudent[s.id] === "Absent" 
                                            ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                        }`}
                                      >
                                        Absent
                                      </button>
                                      <button
                                        onClick={() => setStatusByStudent((p) => ({ ...p, [s.id]: "Late" }))}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                          statusByStudent[s.id] === "Late" 
                                            ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                        }`}
                                      >
                                        Late
                                      </button>
                                      <span className="ml-2 text-xs font-medium text-muted-foreground">
                                        {statusByStudent[s.id] ? statusByStudent[s.id].charAt(0).toUpperCase() + statusByStudent[s.id].slice(1).toLowerCase() : '-'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="teacher" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                  <div>
                    <CardTitle>Mark teacher attendance</CardTitle>
                  </div>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">Date</label>
                      <DatePicker value={teacherDate} onChange={setTeacherDate} placeholder="Select date" className="w-[180px]" />
                    </div>
                    {teachers.length > 0 && (
                      <Button onClick={handleSaveTeacherAttendance} disabled={teacherSaving} className="mb-0.5">{teacherSaving ? "Saving..." : "Save"}</Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teacherLoading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : (
                    <>

                      {/* Beautiful Table */}
                      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800/50 border-b border-border/60">
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Teacher</th>
                                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teachers.map((t) => (
                                <tr key={t.teacherUserId} className="border-b border-border/30 last:border-0 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                  <td className="px-4 py-3">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                      {t.teacherName ? t.teacherName.charAt(0).toUpperCase() + t.teacherName.slice(1).toLowerCase() : '-'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setStatusByTeacher((p) => ({ ...p, [t.teacherUserId]: "Present" }))}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                          statusByTeacher[t.teacherUserId] === "Present" 
                                            ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                        }`}
                                      >
                                        Present
                                      </button>
                                      <button
                                        onClick={() => setStatusByTeacher((p) => ({ ...p, [t.teacherUserId]: "Absent" }))}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                          statusByTeacher[t.teacherUserId] === "Absent" 
                                            ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                        }`}
                                      >
                                        Absent
                                      </button>
                                      <button
                                        onClick={() => setStatusByTeacher((p) => ({ ...p, [t.teacherUserId]: "Late" }))}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                          statusByTeacher[t.teacherUserId] === "Late" 
                                            ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                        }`}
                                      >
                                        Late
                                      </button>
                                      <span className="ml-2 text-xs font-medium text-muted-foreground">
                                        {statusByTeacher[t.teacherUserId] ? statusByTeacher[t.teacherUserId].charAt(0).toUpperCase() + statusByTeacher[t.teacherUserId].slice(1).toLowerCase() : '-'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
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
