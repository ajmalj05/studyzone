import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAcademicYear } from "@/context/AcademicYearContext";
import { CurrentAcademicYearBadge } from "@/components/CurrentAcademicYearBadge";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface ClassDto {
  id: string;
  name: string;
  code: string;
}

interface BatchDto {
  id: string;
  classId: string;
  className: string;
  academicYearId: string;
  academicYearName?: string;
  name: string;
  section?: string;
  seatLimit?: number;
  classTeacherUserId?: string;
  classTeacherName?: string;
}

interface TeacherUserDto {
  id: string;
  name: string;
  userId: string;
  role: string;
}

export default function ClassTeacherAssign() {
  const { currentYear, academicYears, loading: yearLoading } = useAcademicYear();
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingBatchId, setUpdatingBatchId] = useState<string | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const [classList, teacherList] = await Promise.all([
          fetchApi("/Classes") as Promise<ClassDto[]>,
          fetchApi("/Users?role=teacher") as Promise<TeacherUserDto[]>,
        ]);
        setClasses(Array.isArray(classList) ? classList : []);
        setTeachers(Array.isArray(teacherList) ? teacherList : []);
      } catch (e: unknown) {
        toast({
          title: "Error",
          description: (e as Error).message || "Failed to load classes or teachers",
          variant: "destructive",
        });
      }
    })();
  }, []);

  useEffect(() => {
    const academicYearId = currentYear?.id;
    if (!academicYearId) {
      setBatches([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const url = `/Batches?academicYearId=${encodeURIComponent(academicYearId)}`;
        const list = (await fetchApi(url)) as BatchDto[];
        const safeList = Array.isArray(list) ? list : [];
        setBatches(safeList);
        setPendingAssignments(
          safeList.reduce<Record<string, string>>((acc, b) => {
            acc[b.id] = b.classTeacherUserId || "_none";
            return acc;
          }, {}),
        );
      } catch (e: unknown) {
        toast({
          title: "Error",
          description: (e as Error).message || "Failed to load batches",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [currentYear?.id]);

  const updateBatchTeacher = async (batch: BatchDto, teacherUserId: string | null) => {
    setUpdatingBatchId(batch.id);
    try {
      const payload = {
        classId: batch.classId,
        academicYearId: batch.academicYearId || currentYear?.id,
        name: batch.name,
        section: batch.section || undefined,
        seatLimit: batch.seatLimit,
        classTeacherUserId: teacherUserId || undefined,
      };

      await fetchApi(`/Batches/${batch.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const teacher = teacherUserId ? teachers.find((t) => t.id === teacherUserId) : undefined;

      setBatches((prev) =>
        prev.map((b) =>
          b.id === batch.id
            ? {
                ...b,
                classTeacherUserId: teacherUserId || undefined,
                classTeacherName: teacher ? teacher.name : undefined,
              }
            : b,
        ),
      );

      setPendingAssignments((prev) => ({
        ...prev,
        [batch.id]: teacherUserId || "_none",
      }));

      toast({
        title: "Saved",
        description: "Class teacher updated for this batch.",
      });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to update class teacher",
        variant: "destructive",
      });
    } finally {
      setUpdatingBatchId(null);
    }
  };

  const classesById = new Map(classes.map((c) => [c.id, c]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DashboardHeader
          title="Class Teacher Mapping"
          description="Assign class teachers to batches for the current academic year."
        />
        <CurrentAcademicYearBadge />
      </div>

      {yearLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">Loading academic year…</div>
      ) : !currentYear ? (
        <Card>
          <CardHeader>
            <CardTitle>No current academic year</CardTitle>
            <CardDescription>
              Set a current academic year in the Academic Year settings to manage class teacher mappings.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">Loading batches…</div>
      ) : batches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No batches</CardTitle>
            <CardDescription>No batches found for the selected academic year.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Batches and class teachers</CardTitle>
            <CardDescription>Set a class teacher for each batch. Changes are saved per batch.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Academic year</TableHead>
                  <TableHead>Class teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => {
                  const cls = classesById.get(b.classId);
                  const currentValue = b.classTeacherUserId || "_none";
                  const selectedValue = pendingAssignments[b.id] ?? currentValue;
                  const hasChanges = selectedValue !== currentValue;
                  return (
                    <TableRow key={b.id}>
                      <TableCell>{b.className || cls?.name || "—"}</TableCell>
                      <TableCell>{b.name}</TableCell>
                      <TableCell>{b.section ?? "—"}</TableCell>
                      <TableCell>{b.academicYearName ?? academicYears.find((y) => y.id === b.academicYearId)?.name ?? "—"}</TableCell>
                      <TableCell>
                        {teachers.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No teacher users found.</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Select
                              value={selectedValue}
                              onValueChange={(v) =>
                                setPendingAssignments((prev) => ({
                                  ...prev,
                                  [b.id]: v,
                                }))
                              }
                              disabled={updatingBatchId === b.id}
                            >
                              <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Select class teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none">None</SelectItem>
                                {teachers.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.name} ({t.userId})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() =>
                                updateBatchTeacher(
                                  b,
                                  selectedValue === "_none" ? null : selectedValue,
                                )
                              }
                              disabled={updatingBatchId === b.id || !hasChanges}
                            >
                              {updatingBatchId === b.id ? "Saving…" : "Save"}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

