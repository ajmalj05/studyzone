import { useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
        toast({ title: "Error", description: (e as Error).message || "Failed to load classes or teachers", variant: "destructive" });
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
        const list = (await fetchApi(`/Batches?academicYearId=${encodeURIComponent(academicYearId)}`)) as BatchDto[];
        const safeList = Array.isArray(list) ? list : [];
        setBatches(safeList);
        setPendingAssignments(
          safeList.reduce<Record<string, string>>((acc, b) => {
            acc[b.id] = b.classTeacherUserId || "_none";
            return acc;
          }, {}),
        );
      } catch (e: unknown) {
        toast({ title: "Error", description: (e as Error).message || "Failed to load batches", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [currentYear?.id]);

  const updateBatchTeacher = async (batch: BatchDto, teacherUserId: string | null) => {
    if (teacherUserId) {
      const existing = batches.find((b) => b.id !== batch.id && b.classTeacherUserId === teacherUserId);
      if (existing) {
        const teacher = teachers.find((t) => t.id === teacherUserId);
        const teacherName = teacher?.name ?? "This teacher";
        const location = `${existing.className || classesById.get(existing.classId)?.name || "this class"} - ${existing.name}`;
        toast({
          title: "Teacher already assigned",
          description: `${teacherName} is already assigned to ${location}.`,
          variant: "destructive",
        });
        setPendingAssignments((prev) => ({ ...prev, [batch.id]: batch.classTeacherUserId || "_none" }));
        return;
      }
    }

    setUpdatingBatchId(batch.id);
    try {
      await fetchApi(`/Batches/${batch.id}`, {
        method: "PUT",
        body: JSON.stringify({
          classId: batch.classId,
          academicYearId: batch.academicYearId || currentYear?.id,
          name: batch.name,
          seatLimit: batch.seatLimit,
          classTeacherUserId: teacherUserId || undefined,
        }),
      });
      const teacher = teacherUserId ? teachers.find((t) => t.id === teacherUserId) : undefined;
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batch.id
            ? { ...b, classTeacherUserId: teacherUserId || undefined, classTeacherName: teacher?.name }
            : b,
        ),
      );
      setPendingAssignments((prev) => ({ ...prev, [batch.id]: teacherUserId || "_none" }));
      toast({ title: "Saved", description: "Class teacher updated for this batch." });
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to update class teacher", variant: "destructive" });
    } finally {
      setUpdatingBatchId(null);
    }
  };

  const classesById = new Map(classes.map((c) => [c.id, c]));

  const columns: DataTableColumn<BatchDto>[] = [
    {
      key: "class",
      header: "Class",
      cell: (b) => <span className="font-medium capitalize">{b.className || classesById.get(b.classId)?.name || "—"}</span>,
    },
    {
      key: "batch",
      header: "Batch",
      cell: (b) => <span className="capitalize">{b.name}</span>,
    },
    {
      key: "academicYear",
      header: "Academic Year",
      cell: (b) => (
        <span className="text-muted-foreground">
          {b.academicYearName ?? academicYears.find((y) => y.id === b.academicYearId)?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "classTeacher",
      header: "Class Teacher",
      className: "w-[320px]",
      cell: (b) => {
        const currentValue = b.classTeacherUserId || "_none";
        const selectedValue = pendingAssignments[b.id] ?? currentValue;
        const hasChanges = selectedValue !== currentValue;
        if (teachers.length === 0) {
          return <span className="text-sm text-muted-foreground">No teacher users found.</span>;
        }
        return (
          <div className="flex items-center gap-2 w-full max-w-sm">
            <SearchableSelect
              value={selectedValue}
              onValueChange={(v) => setPendingAssignments((prev) => ({ ...prev, [b.id]: v }))}
              disabled={updatingBatchId === b.id}
              placeholder="Select class teacher"
              className="flex-1 min-w-[160px]"
              options={[
                { value: "_none", label: "None" },
                ...teachers.map((t) => ({ value: t.id, label: `${t.name} (${t.userId})` })),
              ]}
            />
            <Button
              size="sm"
              onClick={() => updateBatchTeacher(b, selectedValue === "_none" ? null : selectedValue)}
              disabled={updatingBatchId === b.id || !hasChanges}
            >
              {updatingBatchId === b.id ? "Saving…" : "Save"}
            </Button>
          </div>
        );
      },
    },
  ];

  const isLoading = yearLoading || loading;
  const emptyMessage = !currentYear ? "No current academic year" : "No batches found";
  const emptyDescription = !currentYear
    ? "Set a current academic year in settings to manage class teacher mappings."
    : "No batches found for the selected academic year.";

  return (
    <DataTable
      data={batches}
      columns={columns}
      keyExtractor={(b) => b.id}
      loading={isLoading}
      emptyMessage={emptyMessage}
      emptyDescription={emptyDescription}
    />
  );
}
