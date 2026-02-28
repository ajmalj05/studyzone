import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ClipboardCheck, DollarSign, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchApi } from "@/lib/api";

interface ParentChildDto {
  studentId: string;
  name: string;
  admissionNumber?: string;
  className?: string;
  batchName?: string;
  section?: string;
}

const ParentChildren = () => {
  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/ParentPortal/my-children")
      .then((list) => setChildren(Array.isArray(list) ? list : []))
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">My Children</h1>
      {loading ? (
        <Card className="rounded-[var(--radius)]"><CardContent className="p-8">Loading...</CardContent></Card>
      ) : children.length === 0 ? (
        <Card className="rounded-[var(--radius)]">
          <CardContent className="p-8 text-center text-muted-foreground">
            No children linked to your account. Contact the school admin to link your parent account to your children.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((c, i) => (
            <motion.div
              key={c.studentId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="rounded-[var(--radius)] shadow-card">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{c.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {c.className ?? "—"} {c.section ? `• ${c.section}` : ""} {c.admissionNumber ? `• ${c.admissionNumber}` : ""}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl" asChild>
                    <Link to={`/parent/attendance?studentId=${c.studentId}`}><ClipboardCheck className="h-4 w-4 mr-1" /> Attendance</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl" asChild>
                    <Link to={`/parent/fees?studentId=${c.studentId}`}><DollarSign className="h-4 w-4 mr-1" /> Fees</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl" asChild>
                    <Link to={`/parent/reports?studentId=${c.studentId}`}><FileText className="h-4 w-4 mr-1" /> Results</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl" asChild>
                    <Link to={`/parent/timetable?studentId=${c.studentId}`}><Calendar className="h-4 w-4 mr-1" /> Timetable</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentChildren;
