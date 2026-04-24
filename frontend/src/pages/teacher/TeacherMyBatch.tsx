import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useMyBatch } from "@/context/TeacherBatchContext";

/** @deprecated Use `/teacher/batches/:batchId` — kept for bookmarks and old links. */
export default function TeacherMyBatch() {
  const { myBatch, loading } = useMyBatch();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">Loading…</div>
    );
  }

  if (!myBatch) {
    return (
      <div className="space-y-4">
        <Card className="rounded-[var(--radius)] border-muted">
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">
              You are not assigned as class teacher of any batch. Open <strong>My classes</strong> to see all
              assignments.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Navigate to={`/teacher/batches/${myBatch.id}`} replace />;
}
