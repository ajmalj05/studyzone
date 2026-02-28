import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchApi } from "@/lib/api";

interface ParentChildDto {
  studentId: string;
  name: string;
  className?: string;
}

interface ResultRow {
  examId: string;
  examName: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
}

const ParentReports = () => {
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("studentId");
  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [studentId, setStudentId] = useState(studentIdParam ?? "");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApi("/ParentPortal/my-children")
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setChildren(arr);
        if (!studentId && arr.length > 0) setStudentId(arr[0].studentId);
        if (studentIdParam && arr.some((c: ParentChildDto) => c.studentId === studentIdParam)) setStudentId(studentIdParam);
      })
      .catch(() => setChildren([]));
  }, [studentIdParam]);

  useEffect(() => {
    if (!studentId) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetchApi(`/ParentPortal/children/${studentId}/results`)
      .then((list) => setResults(Array.isArray(list) ? list : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  const byExam = results.reduce((acc, r) => {
    const key = r.examId;
    if (!acc[key]) acc[key] = { name: r.examName, rows: [] };
    acc[key].rows.push(r);
    return acc;
  }, {} as Record<string, { name: string; rows: ResultRow[] }>);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Report Cards / Results</h1>
      <Card className="rounded-[var(--radius)]">
        <CardContent className="pt-6">
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="w-[280px] rounded-xl">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((c) => (
                <SelectItem key={c.studentId} value={c.studentId}>{c.name} {c.className ? `(${c.className})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {studentId && (
        <>
          {loading ? (
            <Card><CardContent className="p-8">Loading...</CardContent></Card>
          ) : Object.keys(byExam).length > 0 ? (
            Object.entries(byExam).map(([examId, { name, rows }]) => (
              <Card key={examId} className="rounded-[var(--radius)]">
                <CardHeader><CardTitle>{name}</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Obtained</TableHead><TableHead className="text-right">Max</TableHead><TableHead className="text-right">%</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.subject}</TableCell>
                          <TableCell className="text-right">{r.marksObtained}</TableCell>
                          <TableCell className="text-right">{r.maxMarks}</TableCell>
                          <TableCell className="text-right">{r.maxMarks > 0 ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card><CardContent className="p-8 text-muted-foreground">No results for this child yet.</CardContent></Card>
          )}
        </>
      )}
    </div>
  );
};

export default ParentReports;
