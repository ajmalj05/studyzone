import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { Plus, FileText } from "lucide-react";

interface ExamDto {
  id: string;
  name: string;
  type: string;
  classId?: string;
  className?: string;
  examDate?: string;
  createdAt: string;
}

interface MarksEntryDto {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
}

interface ClassDto {
  id: string;
  name: string;
}

interface StudentDto {
  id: string;
  name: string;
}

export default function Exams() {
  const [exams, setExams] = useState<ExamDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [marks, setMarks] = useState<MarksEntryDto[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: "UnitTest", classId: "", examDate: "" });
  const [marksForm, setMarksForm] = useState({ studentId: "", subject: "", marksObtained: "", maxMarks: "100" });
  const [showMarksModal, setShowMarksModal] = useState(false);

  const loadExams = async () => {
    try {
      const list = (await fetchApi("/Exams")) as ExamDto[];
      setExams(list);
    } catch (_) {}
  };

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch (_) {}
  };

  const loadMarks = async () => {
    if (!selectedExamId) return;
    try {
      const list = (await fetchApi(`/Exams/${selectedExamId}/marks`)) as MarksEntryDto[];
      setMarks(list);
    } catch (_) {}
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadExams(), loadClasses()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    loadMarks();
  }, [selectedExamId]);

  useEffect(() => {
    if (!selectedExamId) return;
    const exam = exams.find((e) => e.id === selectedExamId);
    let cancelled = false;
    (async () => {
      try {
        const url = exam?.classId ? `/Students?classId=${exam.classId}&take=500` : "/Students?take=500";
        const res = (await fetchApi(url)) as { items: StudentDto[] };
        if (!cancelled) setStudents(res.items ?? []);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [selectedExamId, exams]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Validation", description: "Exam name required.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/Exams", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          classId: form.classId || undefined,
          examDate: form.examDate ? new Date(form.examDate).toISOString() : undefined,
        }),
      });
      toast({ title: "Success", description: "Exam created." });
      setShowCreate(false);
      setForm({ name: "", type: "UnitTest", classId: "", examDate: "" });
      await loadExams();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !marksForm.studentId || !marksForm.subject.trim()) {
      toast({ title: "Validation", description: "Exam, student and subject required.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/Exams/marks", {
        method: "POST",
        body: JSON.stringify({
          examId: selectedExamId,
          studentId: marksForm.studentId,
          subject: marksForm.subject,
          marksObtained: parseFloat(marksForm.marksObtained) || 0,
          maxMarks: parseFloat(marksForm.maxMarks) || 100,
        }),
      });
      toast({ title: "Success", description: "Marks saved." });
      setMarksForm({ studentId: "", subject: "", marksObtained: "", maxMarks: "100" });
      setShowMarksModal(false);
      await loadMarks();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardHeader title="Exams & Results" />
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Create exam</Button>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create exam</DialogTitle>
                <DialogDescription>Add a new exam.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateExam} className="space-y-3">
                <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Mid Term" required /></div>
                <div className="space-y-1"><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="UnitTest">Unit Test</SelectItem><SelectItem value="MidTerm">Mid Term</SelectItem><SelectItem value="Final">Final</SelectItem></SelectContent></Select></div>
                <div className="space-y-1"><Label>Class</Label><Select value={form.classId} onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}><SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger><SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-1"><Label>Date</Label><Input type="date" value={form.examDate} onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))} /></div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className={`card-hover cursor-pointer rounded-lg border p-4 shadow-sm ${selectedExamId === exam.id ? "border-primary" : "border-transparent"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md gradient-primary">
                    <FileText className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{exam.name}</h3>
                    <p className="text-xs text-muted-foreground">{exam.className ?? "All"} · {exam.type}</p>
                    {exam.examDate && <p className="text-xs text-muted-foreground">{new Date(exam.examDate).toLocaleDateString()}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedExam && (
            <Card>
              <CardHeader>
                <CardTitle>Marks — {selectedExam.name}</CardTitle>
                <CardDescription>Add or view marks per student and subject.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => setShowMarksModal(true)}><Plus className="h-4 w-4 mr-2" /> Add marks</Button>
                <Dialog open={showMarksModal} onOpenChange={setShowMarksModal}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add marks</DialogTitle>
                      <DialogDescription>Student, subject and marks for {selectedExam.name}.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveMarks} className="space-y-3">
                      <div className="space-y-1"><Label>Student</Label><Select value={marksForm.studentId} onValueChange={(v) => setMarksForm((f) => ({ ...f, studentId: v }))}><SelectTrigger><SelectValue placeholder="Student" /></SelectTrigger><SelectContent>{students.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select></div>
                      <div className="space-y-1"><Label>Subject</Label><Input value={marksForm.subject} onChange={(e) => setMarksForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Subject" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label>Marks</Label><Input type="number" min="0" step="0.01" value={marksForm.marksObtained} onChange={(e) => setMarksForm((f) => ({ ...f, marksObtained: e.target.value }))} placeholder="Obtained" /></div>
                        <div className="space-y-1"><Label>Max</Label><Input type="number" min="1" value={marksForm.maxMarks} onChange={(e) => setMarksForm((f) => ({ ...f, maxMarks: e.target.value }))} /></div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowMarksModal(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left py-2">Student</th><th className="text-left py-2">Subject</th><th className="text-left py-2">Marks</th><th className="text-left py-2">Max</th></tr></thead>
                  <tbody>
                    {marks.map((m) => (
                      <tr key={m.id} className="border-b"><td className="py-2">{m.studentName}</td><td>{m.subject}</td><td>{m.marksObtained}</td><td>{m.maxMarks}</td></tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  );
}
