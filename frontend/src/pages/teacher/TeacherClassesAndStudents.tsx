import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, School } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { batchDisplayName, type TeacherAssignedBatchRow } from "@/context/TeacherCurrentBatchContext";

const TeacherClassesAndStudents = () => {
  const [batches, setBatches] = useState<TeacherAssignedBatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/TeacherPortal/assigned-batches")
      .then((list) => {
        const rows = Array.isArray(list) ? (list as TeacherAssignedBatchRow[]) : [];
        setBatches(rows);
      })
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Loading your classes…</CardContent>
        </Card>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="rounded-[var(--radius)] border-muted">
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">
              You are not assigned to any batch or class. Assignments are made by admin (class teacher or subject
              teacher in timetable).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Open a class to view roster, mark attendance (if you are the class teacher), and jump to marks.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {batches.map((batch, i) => (
          <motion.div
            key={batch.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full rounded-[var(--radius)] shadow-card transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{batchDisplayName(batch)}</CardTitle>
                  {batch.isClassTeacher ? (
                    <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      Class teacher
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Subject
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {batch.subjectsTaught.length > 0 ? (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    <School className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
                    {batch.subjectsTaught.slice(0, 4).join(" · ")}
                    {batch.subjectsTaught.length > 4 ? "…" : ""}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No timetable subjects listed for this batch.</p>
                )}
                <Button asChild className="w-full rounded-xl gap-2">
                  <Link to={`/teacher/batches/${batch.id}`}>
                    <BookOpen className="h-4 w-4" /> Open class
                    <ChevronRight className="ml-auto h-4 w-4 opacity-70" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TeacherClassesAndStudents;
