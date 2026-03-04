import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DownloadModal } from "@/components/DownloadModal";
import { toast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Users, ClipboardCheck, BookOpen, FileText, DollarSign, Bell, UserCircle, PenLine, Calendar, Download, MessageSquare
} from "lucide-react";


const students = [
  { id: 1, name: "Rahul Sharma", roll: "101" },
  { id: 2, name: "Priya Patel", roll: "102" },
  { id: 3, name: "Amit Kumar", roll: "103" },
  { id: 4, name: "Sneha Gupta", roll: "104" },
];

const getGrade = (marks: number) => {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B+";
  if (marks >= 60) return "B";
  if (marks >= 50) return "C";
  return "F";
};

const TeacherExams = () => {
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [showDownload, setShowDownload] = useState(false);

  const handleSubmit = () => {
    toast({ title: "Marks Submitted", description: "Marks have been saved successfully." });
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Add Marks</h1>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowDownload(true)}>
            <Download className="h-4 w-4" /> Export Marks
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[var(--radius)] shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Exam — Mid-Term (Max: 100)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.map((s, i) => {
                  const mark = parseInt(marks[s.id] || "0");
                  const grade = marks[s.id] ? getGrade(mark) : "—";
                  return (
                    <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4 rounded-xl bg-muted/50 px-4 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-primary-foreground text-sm font-bold">{s.roll}</div>
                      <span className="flex-1 font-medium text-foreground text-sm">{s.name}</span>
                      <Input type="number" placeholder="Marks" value={marks[s.id] || ""} onChange={(e) => setMarks((p) => ({ ...p, [s.id]: e.target.value }))} className="w-24 rounded-xl text-center" min={0} max={100} />
                      <span className={`w-10 text-center text-sm font-bold ${grade === "F" ? "text-destructive" : "text-primary"}`}>{grade}</span>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end">
                <Button className="gradient-primary text-primary-foreground rounded-xl px-8" onClick={handleSubmit}>Submit Marks</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      <DownloadModal open={showDownload} onClose={() => setShowDownload(false)} title="Class Mark List" previewData={{ headers: ["Roll", "Name", "Marks", "Grade"], rows: students.map(s => [s.roll, s.name, marks[s.id] || "—", marks[s.id] ? getGrade(parseInt(marks[s.id])) : "—"]) }} />
    </div>
  );
};

export default TeacherExams;
