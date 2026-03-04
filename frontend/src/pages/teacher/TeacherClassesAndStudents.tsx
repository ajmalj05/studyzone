import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface AssignedBatchDto {
  id: string;
  name: string;
  classId: string;
  className: string;
}

interface StudentDto {
  id: string;
  name: string;
  admissionNumber?: string;
  className?: string;
}

const TeacherClassesAndStudents = () => {
  const [batches, setBatches] = useState<AssignedBatchDto[]>([]);
  const [studentsByBatch, setStudentsByBatch] = useState<Record<string, StudentDto[]>>({});
  const [loading, setLoading] = useState(true);
  const [openBatchId, setOpenBatchId] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/TeacherPortal/assigned-batches")
      .then((list: AssignedBatchDto[]) => setBatches(Array.isArray(list) ? list : []))
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, []);

  const loadStudentsForBatch = async (batchId: string) => {
    if (studentsByBatch[batchId] !== undefined) return;
    try {
      const res = (await fetchApi(`/Students?batchId=${encodeURIComponent(batchId)}&status=Active&take=500`)) as {
        items?: StudentDto[];
      };
      const items = res?.items ?? [];
      setStudentsByBatch((prev) => ({ ...prev, [batchId]: items }));
    } catch {
      setStudentsByBatch((prev) => ({ ...prev, [batchId]: [] }));
    }
  };

  const handleOpenChange = (batchId: string, open: boolean) => {
    if (open) {
      setOpenBatchId(batchId);
      loadStudentsForBatch(batchId);
    } else {
      setOpenBatchId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Classes & Students</h1>
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent></Card>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Classes & Students</h1>
        <Card className="rounded-[var(--radius)] border-muted">
          <CardContent className="py-6">
            <p className="text-muted-foreground text-center">You are not assigned to any batch or class. Assignments are made by admin (class teacher or subject teacher in timetable).</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Classes & Students</h1>
        <p className="text-sm text-muted-foreground">View only — your assigned batches and their students</p>
      </div>

      <Card className="rounded-[var(--radius)] shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Your batches
          </CardTitle>
          <p className="text-sm text-muted-foreground">Expand a batch to see the student list.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {batches.map((batch) => (
            <Collapsible
              key={batch.id}
              open={openBatchId === batch.id}
              onOpenChange={(open) => handleOpenChange(batch.id, open)}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  {openBatchId === batch.id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium text-foreground">
                    {batch.className} – {batch.name}
                  </span>
                  {studentsByBatch[batch.id] !== undefined && (
                    <span className="text-sm text-muted-foreground ml-auto">
                      {studentsByBatch[batch.id].length} student(s)
                    </span>
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-7 pr-4 pt-2 pb-4">
                  {studentsByBatch[batch.id] === undefined ? (
                    <p className="text-sm text-muted-foreground py-2">Loading students...</p>
                  ) : studentsByBatch[batch.id].length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No active students in this batch.</p>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border">
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Roll</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsByBatch[batch.id].map((s) => (
                            <tr key={s.id} className="border-b border-border/50 last:border-0">
                              <td className="px-4 py-2 font-medium text-foreground">{s.admissionNumber ?? "—"}</td>
                              <td className="px-4 py-2 text-foreground">{s.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherClassesAndStudents;
