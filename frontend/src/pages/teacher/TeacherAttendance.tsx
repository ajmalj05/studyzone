import { Link, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMyBatch } from "@/context/TeacherBatchContext";

/** @deprecated Student attendance lives under `/teacher/batches/:batchId/attendance` for your class-teacher batch. */
const TeacherAttendance = () => {
  const { myBatch, loading: myBatchLoading } = useMyBatch();

  if (myBatchLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">Loading…</div>
    );
  }

  if (myBatch) {
    return <Navigate to={`/teacher/batches/${myBatch.id}/attendance`} replace />;
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-[var(--radius)] border-muted">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-muted-foreground">
            Marking attendance for a class is only available when you are the class teacher for that batch. Open a
            class from My classes, or contact admin if you expect to mark attendance.
          </p>
          <Button asChild variant="default" className="rounded-xl">
            <Link to="/teacher/classes">Go to My classes</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAttendance;
