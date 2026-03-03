import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Users } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useMyBatch } from "@/context/TeacherBatchContext";

export default function TeacherMyBatch() {
  const { myBatch, loading } = useMyBatch();
  const [studentCount, setStudentCount] = useState<number | null>(null);

  useEffect(() => {
    if (!myBatch?.id) {
      setStudentCount(null);
      return;
    }
    fetchApi(`/Students?batchId=${myBatch.id}&status=Active&take=1`)
      .then((res: { total?: number }) => setStudentCount(res?.total ?? 0))
      .catch(() => setStudentCount(null));
  }, [myBatch?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!myBatch) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">My Batch</h1>
        <Card className="rounded-[var(--radius)] border-muted">
          <CardContent className="py-10">
            <p className="text-muted-foreground text-center">
              You are not assigned as class teacher of any batch. Please contact admin to assign you to a batch (e.g. Class 8 – B).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const batchDisplayName = `${myBatch.className} – ${myBatch.name}`;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">My Batch</h1>
      <Card className="rounded-[var(--radius)] shadow-card">
        <CardHeader>
          <CardTitle>{batchDisplayName}</CardTitle>
          <CardDescription>
            Your class batch. Mark daily attendance and manage students.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {studentCount !== null && (
            <p className="text-sm text-muted-foreground">
              <strong>{studentCount}</strong> active student{studentCount !== 1 ? "s" : ""} in this batch.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-xl gap-2">
              <Link to="/teacher/attendance">
                <ClipboardCheck className="h-4 w-4" /> Mark Attendance
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl gap-2">
              <Link to="/teacher/students">
                <Users className="h-4 w-4" /> View Students
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
