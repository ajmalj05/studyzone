import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DownloadModal } from "@/components/DownloadModal";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { Download } from "lucide-react";

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

interface StudentDto {
  id: string;
  name: string;
  admissionNumber?: string;
}

interface SubjectDto {
  id: string;
  name: string;
  code?: string;
}

const getGrade = (marks: number) => {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B+";
  if (marks >= 60) return "B";
  if (marks >= 50) return "C";
  return "F";
};

const TeacherExams = () => {
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [exams, setExams] = useState<ExamDto[]>([]);
  const [filteredExams, setFilteredExams] = useState<ExamDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [marks, setMarks] = useState<MarksEntryDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [marksByStudentSubject, setMarksByStudentSubject] = useState<Record<string, { obtained: string; max: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchApi("/TeacherPortal/assigned-class-ids") as Promise<string[]>,
      fetchApi("/Exams") as Promise<ExamDto[]>,
    ])
      .then(([classIds, examList]) => {
        setAssignedClassIds(Array.isArray(classIds) ? classIds : []);
        const all = Array.isArray(examList) ? examList : [];
        setExams(all);
        const assigned = all.filter((e) => e.classId && classIds.includes(e.classId));
        setFilteredExams(assigned);
      })
      .catch((e: Error) => toast({ title: "Error", description: e.message || "Failed to load", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const selectedExam = filteredExams.find((e) => e.id === selectedExamId);

  useEffect(() => {
    if (!selectedExamId || !selectedExam?.classId) {
      setStudents([]);
      setSubjects([]);
      setMarks([]);
      setMarksByStudentSubject({});
      return;
    }
    setLoading(true);
    Promise.all([
      fetchApi(`/Students?classId=${encodeURIComponent(selectedExam!.classId!)}&status=Active&take=500`) as Promise<{ items: StudentDto[] }>,
      fetchApi(`/Subjects/for-class/${selectedExam!.classId}`) as Promise<SubjectDto[]>,
      fetchApi(`/Exams/${selectedExamId}/marks`) as Promise<MarksEntryDto[]>,
    ])
      .then(([res, subjList, marksList]) => {
        setStudents(res?.items ?? []);
        setSubjects(Array.isArray(subjList) ? subjList : []);
        setMarks(Array.isArray(marksList) ? marksList : []);
        const map: Record<string, { obtained: string; max: string }> = {};
        (marksList || []).forEach((m) => {
          const key = `${m.studentId}:${m.subject}`;
          map[key] = { obtained: String(m.marksObtained), max: String(m.maxMarks) };
        });
        setMarksByStudentSubject(map);
      })
      .catch((e: Error) => toast({ title: "Error", description: e.message || "Failed to load", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [selectedExamId, selectedExam?.classId]);

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) setSelectedSubject(subjects[0].name);
  }, [subjects, selectedSubject]);

  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedSubject.trim()) {
      toast({ title: "Validation", description: "Select an exam and subject.", variant: "destructive" });
      return;
    }
    setSaving(true);
    let saved = 0;
    let failed = 0;
    for (const s of students) {
      const key = `${s.id}:${selectedSubject}`;
      const val = marksByStudentSubject[key];
      if (!val || (val.obtained === "" && val.max === "")) continue;
      const obtained = parseFloat(val.obtained) || 0;
      const max = parseFloat(val.max) || 100;
      try {
        await fetchApi("/Exams/marks", {
          method: "POST",
          body: JSON.stringify({
            examId: selectedExamId,
            studentId: s.id,
            subject: selectedSubject,
            marksObtained: obtained,
            maxMarks: max,
          }),
        });
        saved++;
      } catch {
        failed++;
      }
    }
    setSaving(false);
    if (saved > 0) {
      toast({ title: "Success", description: `Marks saved for ${saved} student(s).` });
      const list = (await fetchApi(`/Exams/${selectedExamId}/marks`)) as MarksEntryDto[];
      setMarks(Array.isArray(list) ? list : []);
      const map: Record<string, { obtained: string; max: string }> = {};
      (list || []).forEach((m) => {
        const key = `${m.studentId}:${m.subject}`;
        map[key] = { obtained: String(m.marksObtained), max: String(m.maxMarks) };
      });
      setMarksByStudentSubject((prev) => ({ ...prev, ...map }));
    }
    if (failed > 0) toast({ title: "Error", description: `${failed} save(s) failed.`, variant: "destructive" });
  };

  const setMark = (studentId: string, obtained: string, max: string) => {
    const key = `${studentId}:${selectedSubject}`;
    setMarksByStudentSubject((p) => ({ ...p, [key]: { obtained, max } }));
  };

  const selectedExamName = selectedExam ? `${selectedExam.name} (${selectedExam.className ?? "Class"})` : "Select exam";
  const exportRows = students.map((s) => {
    const key = `${s.id}:${selectedSubject}`;
    const val = marksByStudentSubject[key];
    const m = val ? parseInt(val.obtained || "0", 10) : 0;
    return [s.admissionNumber ?? s.name, s.name, val?.obtained ?? "—", getGrade(m)];
  });

  if (loading && exams.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Add Marks</h1>
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-foreground">Add Marks</h1>
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowDownload(true)} disabled={students.length === 0}>
          <Download className="h-4 w-4" /> Export Marks
        </Button>
      </div>

      <Card className="rounded-[var(--radius)] shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Exam & subject</CardTitle>
          <p className="text-sm text-muted-foreground">Select an exam for a class you teach, then enter marks by subject.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Exam</label>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger className="w-[280px] rounded-xl">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {filteredExams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} — {e.className ?? "Class"} ({e.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredExams.length === 0 && !loading && (
        <Card className="rounded-[var(--radius)] border-muted">
          <CardContent className="py-6">
            <p className="text-muted-foreground text-center">No exams for your assigned classes. Exams are created by admin.</p>
          </CardContent>
        </Card>
      )}

      {selectedExamId && selectedExam && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[var(--radius)] shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">{selectedExamName} — {selectedSubject || "Subject"}</CardTitle>
              <p className="text-sm text-muted-foreground">Enter or update marks. Default max 100.</p>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-muted-foreground py-4">No active students in this class.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {students.map((s, i) => {
                      const key = `${s.id}:${selectedSubject}`;
                      const val = marksByStudentSubject[key] ?? { obtained: "", max: "100" };
                      const num = parseInt(val.obtained || "0", 10);
                      const grade = val.obtained ? getGrade(num) : "—";
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-4 rounded-xl bg-muted/50 px-4 py-3"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-primary-foreground text-sm font-bold">
                            {s.admissionNumber?.slice(-2) ?? s.name.charAt(0)}
                          </div>
                          <span className="flex-1 font-medium text-foreground text-sm min-w-[120px]">{s.name}</span>
                          <Input
                            type="number"
                            placeholder="Marks"
                            value={val.obtained}
                            onChange={(e) => setMark(s.id, e.target.value, val.max)}
                            className="w-24 rounded-xl text-center"
                            min={0}
                            max={999}
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={val.max}
                            onChange={(e) => setMark(s.id, val.obtained, e.target.value)}
                            className="w-16 rounded-xl text-center"
                            min={1}
                          />
                          <span className={`w-10 text-center text-sm font-bold ${grade === "F" ? "text-destructive" : "text-primary"}`}>
                            {grade}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button
                      className="gradient-primary text-primary-foreground rounded-xl px-8"
                      onClick={handleSaveMarks}
                      disabled={saving || subjects.length === 0}
                    >
                      {saving ? "Saving..." : "Save marks"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <DownloadModal
        open={showDownload}
        onClose={() => setShowDownload(false)}
        title="Class mark list"
        previewData={{
          headers: ["Roll", "Name", "Marks", "Grade"],
          rows: exportRows,
        }}
      />
    </div>
  );
};

export default TeacherExams;
