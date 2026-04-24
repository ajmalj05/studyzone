import { Link, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMyBatch } from "@/context/TeacherBatchContext";

/** @deprecated Use `/teacher/batches/:batchId/roster` — roster is available for every assigned batch from My classes. */
const TeacherStudents = () => {
  const { myBatch, loading: myBatchLoading } = useMyBatch();

  if (myBatchLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">Loading…</div>
    );
  }

  if (myBatch) {
    return <Navigate to={`/teacher/batches/${myBatch.id}/roster`} replace />;
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-[var(--radius)] border-muted">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-muted-foreground">
            Student roster is organized by class. Open one of your assigned classes to view its roster.
          </p>
          <Button asChild variant="default" className="rounded-xl">
            <Link to="/teacher/classes">Go to My classes</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherStudents;
