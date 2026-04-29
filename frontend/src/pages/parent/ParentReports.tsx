import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { fetchApi } from "@/lib/api";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Download, Loader2, BookOpen, TrendingUp, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDocumentHeader, getDocumentFooter, getStandardDocumentCss, type SchoolProfileForReceipt } from "@/lib/receiptHtml";

interface ParentChildDto {
  studentId: string;
  name: string;
  admissionNumber?: string;
  className?: string;
  batchName?: string;
}

interface ResultRow {
  examId: string;
  examName: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
}

const getGrade = (obtained: number, max: number) => {
  if (max <= 0) return "—";
  const pct = (obtained / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  return "F";
};

const gradeColor = (grade: string) => {
  if (grade === "A+" || grade === "A") return "text-emerald-600 dark:text-emerald-400";
  if (grade === "B+" || grade === "B") return "text-blue-600 dark:text-blue-400";
  if (grade === "C") return "text-amber-600 dark:text-amber-400";
  if (grade === "F") return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
};

const ParentReports = () => {
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("studentId");
  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [studentId, setStudentId] = useState(studentIdParam ?? "");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  usePageHeaderConfigEffect(
    { title: "Report cards", description: "Published exam marks for each child." },
    [],
  );

  useEffect(() => {
    fetchApi("/ParentPortal/my-children")
      .then((list) => {
        const arr = Array.isArray(list) ? (list as ParentChildDto[]) : [];
        setChildren(arr);
        if (!studentId && arr.length > 0) setStudentId(arr[0].studentId);
        if (studentIdParam && arr.some((c) => c.studentId === studentIdParam)) setStudentId(studentIdParam);
      })
      .catch(() => setChildren([]));
  }, [studentIdParam]);

  useEffect(() => {
    if (!studentId) { setResults([]); return; }
    setLoading(true);
    fetchApi(`/ParentPortal/children/${studentId}/results`)
      .then((list) => setResults(Array.isArray(list) ? (list as ResultRow[]) : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  const child = children.find((c) => c.studentId === studentId);

  const byExam = results.reduce((acc, r) => {
    if (!acc[r.examId]) acc[r.examId] = { name: r.examName, rows: [] };
    acc[r.examId].rows.push(r);
    return acc;
  }, {} as Record<string, { name: string; rows: ResultRow[] }>);

  const examEntries = Object.entries(byExam);

  // Overall totals across all exams
  const overallObtained = results.reduce((s, r) => s + r.marksObtained, 0);
  const overallMax = results.reduce((s, r) => s + r.maxMarks, 0);
  const overallPct = overallMax > 0 ? Math.round((overallObtained / overallMax) * 100) : 0;

  const handleDownload = async () => {
    if (!child || results.length === 0) return;
    setDownloading(true);
    try {
      const school = await fetchApi("/SchoolProfile").catch(() => null) as SchoolProfileForReceipt | null;

      const examTableRows = examEntries.map(([, { name, rows }]) => {
        const examObtained = rows.reduce((s, r) => s + r.marksObtained, 0);
        const examMax = rows.reduce((s, r) => s + r.maxMarks, 0);
        const examPct = examMax > 0 ? Math.round((examObtained / examMax) * 100) : 0;
        const subjectRows = rows.map((r) => {
          const pct = r.maxMarks > 0 ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0;
          const grade = getGrade(r.marksObtained, r.maxMarks);
          return `<tr>
            <td style="padding-left:20px;color:#555;font-style:italic">${r.subject}</td>
            <td class="text-right">${r.marksObtained}</td>
            <td class="text-right">${r.maxMarks}</td>
            <td class="text-right">${pct}%</td>
            <td class="text-right" style="font-weight:700">${grade}</td>
          </tr>`;
        }).join("");
        return `
          <tr style="background:#f8f9fa">
            <td colspan="5" style="padding:8px 10px;font-weight:700;font-size:10.5pt;border-top:2px solid #ccc">${name}</td>
          </tr>
          ${subjectRows}
          <tr style="background:#f0f4ff">
            <td style="font-weight:600;font-style:italic;color:#444">Exam Total</td>
            <td class="text-right" style="font-weight:700">${examObtained}</td>
            <td class="text-right" style="font-weight:700">${examMax}</td>
            <td class="text-right" style="font-weight:700">${examPct}%</td>
            <td class="text-right" style="font-weight:700">${getGrade(examObtained, examMax)}</td>
          </tr>`;
      }).join("");

      const tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th class="text-right">Obtained</th>
              <th class="text-right">Max</th>
              <th class="text-right">Percentage</th>
              <th class="text-right">Grade</th>
            </tr>
          </thead>
          <tbody>
            ${examTableRows}
            <tr style="background:#e8f5e9;border-top:3px double #999">
              <td style="font-weight:700">Overall Total</td>
              <td class="text-right" style="font-weight:700">${overallObtained}</td>
              <td class="text-right" style="font-weight:700">${overallMax}</td>
              <td class="text-right" style="font-weight:700">${overallPct}%</td>
              <td class="text-right" style="font-weight:700">${getGrade(overallObtained, overallMax)}</td>
            </tr>
          </tbody>
        </table>`;

      const metaHtml = `
        <div class="meta-info">
          <p><strong>Student:</strong> ${child.name}</p>
          ${child.admissionNumber ? `<p><strong>Admission No.:</strong> ${child.admissionNumber}</p>` : ""}
          ${child.className ? `<p><strong>Class:</strong> ${child.className}${child.batchName ? ` — ${child.batchName}` : ""}</p>` : ""}
          <p><strong>Date Issued:</strong> ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>`;

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <title>Report Card — ${child.name}</title>
        <style>
          ${getStandardDocumentCss()}
          @page { size: A4 portrait; margin: 10mm 12mm; }
        </style>
      </head><body><div class="doc-container">
        ${getDocumentHeader(school, "Student Report Card")}
        ${metaHtml}
        ${tableHtml}
        ${getDocumentFooter(school)}
      </div></body></html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) win.addEventListener("load", () => { win.print(); URL.revokeObjectURL(url); });
    } catch {
      // silently fail
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Child selector + download */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1.5 w-full sm:w-auto sm:min-w-[200px]">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student</label>
          <SearchableSelect
            value={studentId}
            onValueChange={setStudentId}
            placeholder="Select child"
            className="w-full max-w-full sm:w-[280px]"
            options={children.map((c) => ({
              value: c.studentId,
              label: `${c.name}${c.className ? ` (${c.className})` : ""}`,
            }))}
          />
        </div>
        {results.length > 0 && (
          <Button
            variant="outline"
            className="gap-2 h-9 w-full sm:w-auto shrink-0"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Report Card
          </Button>
        )}
      </div>

      {/* Summary stats strip */}
      {!loading && results.length > 0 && child && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="rounded-[var(--radius)] border border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Exams</p>
                <p className="text-lg font-bold">{examEntries.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[var(--radius)] border border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overall</p>
                <p className="text-lg font-bold">{overallPct}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[var(--radius)] border border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-violet-100 dark:bg-violet-900/30">
                <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overall grade</p>
                <p className={cn("text-lg font-bold", gradeColor(getGrade(overallObtained, overallMax)))}>
                  {getGrade(overallObtained, overallMax)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-exam cards */}
      {loading ? (
        <Card className="rounded-[var(--radius)]">
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin" />
              <span className="text-sm">Loading results…</span>
            </div>
          </CardContent>
        </Card>
      ) : examEntries.length > 0 ? (
        examEntries.map(([examId, { name, rows }]) => {
          const obtained = rows.reduce((s, r) => s + r.marksObtained, 0);
          const max = rows.reduce((s, r) => s + r.maxMarks, 0);
          const pct = max > 0 ? Math.round((obtained / max) * 100) : 0;
          const grade = getGrade(obtained, max);
          return (
            <Card key={examId} className="rounded-[var(--radius)] border border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 px-4 sm:px-5 py-4 border-b border-border/40 bg-muted/20">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-foreground break-words">{name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{rows.length} subject{rows.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-sm font-bold">{obtained}/{max} &nbsp;<span className={cn("font-bold", gradeColor(grade))}>{grade}</span></p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/10">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Marks</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Max</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">%</th>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const rPct = r.maxMarks > 0 ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0;
                      const rGrade = getGrade(r.marksObtained, r.maxMarks);
                      return (
                        <tr
                          key={i}
                          className={cn(
                            "border-b border-border/30 transition-colors hover:bg-muted/20",
                            i % 2 !== 0 && "bg-muted/10",
                          )}
                        >
                          <td className="px-5 py-3 font-medium text-foreground">{r.subject}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">{r.marksObtained}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.maxMarks}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{rPct}%</td>
                          <td className={cn("px-5 py-3 text-right font-bold", gradeColor(rGrade))}>{rGrade}</td>
                        </tr>
                      );
                    })}
                    {/* Exam total row */}
                    <tr className="bg-muted/30 border-t border-border/60">
                      <td className="px-5 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Total</td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums">{obtained}</td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums text-muted-foreground">{max}</td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums">{pct}%</td>
                      <td className={cn("px-5 py-2.5 text-right font-bold", gradeColor(grade))}>{grade}</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : studentId ? (
        <Card className="rounded-[var(--radius)] border border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No published results yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Results will appear here once approved by your school.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default ParentReports;
