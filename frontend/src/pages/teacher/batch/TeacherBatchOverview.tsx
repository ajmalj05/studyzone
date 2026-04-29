import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, PenLine, Users } from "lucide-react";
import { useTeacherCurrentBatch, batchDisplayName } from "@/context/TeacherCurrentBatchContext";
import { TeacherSelfAttendanceCard } from "@/components/TeacherSelfAttendanceCard";

export default function TeacherBatchOverview() {
  const batch = useTeacherCurrentBatch();
  const base = `/teacher/batches/${batch.id}`;
  const title = batchDisplayName(batch);

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-[var(--radius)] shadow-card">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {batch.isClassTeacher
                ? "You are the class teacher for this batch. Use Roster for the full list and Attendance to mark daily attendance."
                : "You teach this batch on the timetable. Open Roster to view students; only the class teacher can mark batch attendance."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {batch.subjectsTaught.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Your subjects (timetable)
                </p>
                <div className="flex flex-wrap gap-2">
                  {batch.subjectsTaught.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No subject slots found for you in this batch.</p>
            )}

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
              <Button asChild className="w-full rounded-xl gap-2 sm:w-auto">
                <Link to={`${base}/roster`}>
                  <Users className="h-4 w-4" /> Roster
                </Link>
              </Button>
              {batch.isClassTeacher ? (
                <Button asChild variant="default" className="w-full rounded-xl gap-2 bg-success text-success-foreground hover:bg-success/90 sm:w-auto">
                  <Link to={`${base}/attendance`}>
                    <ClipboardCheck className="h-4 w-4" /> Mark attendance
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" className="w-full rounded-xl gap-2 sm:w-auto">
                <Link to={`/teacher/marks?classId=${encodeURIComponent(batch.classId)}`}>
                  <PenLine className="h-4 w-4" /> Marks & exams
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <TeacherSelfAttendanceCard />
    </div>
  );
}
