import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAcademicYear } from "@/context/AcademicYearContext";
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
  const { selectedYearId, academicYears, setSelectedYearId } = useAcademicYear();
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingBatchId, setUpdatingBatchId] = useState<string | null>(null);

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
    (async () => {
      setLoading(true);
      try {
        const url = selectedYearId ? `/Batches?academicYearId=${encodeURIComponent(selectedYearId)}` : "/Batches";
        const list = (await fetchApi(url)) as BatchDto[];
        setBatches(Array.isArray(list) ? list : []);
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
  }, [selectedYearId]);

  const updateBatchTeacher = async (batch: BatchDto, teacherUserId: string | null) => {
    setUpdatingBatchId(batch.id);
    try {
      const payload = {
        classId: batch.classId,
        academicYearId: batch.academicYearId || selectedYearId,
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

  const effectiveYearId = selectedYearId || academicYears[0]?.id || "";

  const handleYearChange = (value: string) => {
    setSelectedYearId(value);
  };

  const classesById = new Map(classes.map((c) => [c.id, c]));

  return (
    <div className="space-y-4">
      <DashboardHeader title="Class Teacher Mapping" description="Assign class teachers to batches for the selected academic year." />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select academic year to view and edit class teacher mappings.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-center">
          <Select value={effectiveYearId} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Academic year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {academicYears.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No academic years configured. Set them up in Academic Year settings.
            </p>
          )}
        </CardContent>
      </Card>

      {loading ? (
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
                  <TableHead className="w-[220px]">Assign</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => {
                  const cls = classesById.get(b.classId);
                  const currentValue = b.classTeacherUserId || "_none";
                  return (
                    <TableRow key={b.id}>
                      <TableCell>{b.className || cls?.name || "—"}</TableCell>
                      <TableCell>{b.name}</TableCell>
                      <TableCell>{b.section ?? "—"}</TableCell>
                      <TableCell>{b.academicYearName ?? academicYears.find((y) => y.id === b.academicYearId)?.name ?? "—"}</TableCell>
                      <TableCell>{b.classTeacherName ?? "—"}</TableCell>
                      <TableCell>
                        {teachers.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No teacher users found.</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Select
                              value={currentValue}
                              onValueChange={(v) =>
                                updateBatchTeacher(
                                  b,
                                  v === "_none"
                                    ? null
                                    : v,
                                )
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
                            {updatingBatchId === b.id && (
                              <Button size="sm" variant="ghost" disabled>
                                Saving…
                              </Button>
                            )}
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

