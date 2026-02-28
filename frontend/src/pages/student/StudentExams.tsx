import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchApi } from "@/lib/api";
import { getStudentMenu } from "@/config/studentMenu";

interface ResultRow {
  examId: string;
  examName: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
}

export default function StudentExams() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = (await fetchApi("/Portal/results")) as ResultRow[];
        setResults(Array.isArray(list) ? list : []);
      } catch (_) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const byExam = results.reduce((acc, r) => {
    const key = r.examId;
    if (!acc[key]) acc[key] = { name: r.examName, rows: [] };
    acc[key].rows.push(r);
    return acc;
  }, {} as Record<string, { name: string; rows: ResultRow[] }>);

  return (
    <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Exam Results</h1>
        {loading ? (
          <Card><CardContent className="p-8">Loading...</CardContent></Card>
        ) : Object.keys(byExam).length > 0 ? (
          Object.entries(byExam).map(([examId, { name, rows }]) => (
            <motion.div key={examId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
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
            </motion.div>
          ))
        ) : (
          <Card><CardContent className="p-8 text-muted-foreground">No results published yet.</CardContent></Card>
        )}
    </div>
  );
}
