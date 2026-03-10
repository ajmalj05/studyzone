import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, History } from "lucide-react";
import { DownloadModal } from "@/components/DownloadModal";
import { fetchApi } from "@/lib/api";
import type { StudentAttendanceDetailDto } from "@/types/attendance";

const StudentAttendanceDetail = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();

  const [fromDate, setFromDate] = useState(() => {
    const queryFrom = searchParams.get("from");
    if (queryFrom) return queryFrom;
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => {
    const queryTo = searchParams.get("to");
    if (queryTo) return queryTo;
    return new Date().toISOString().slice(0, 10);
  });

  const [detail, setDetail] = useState<StudentAttendanceDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);

    const from = new Date(fromDate + "T00:00:00").toISOString();
    const to = new Date(toDate + "T23:59:59").toISOString();

    const url = `/Reports/attendance/student?studentId=${encodeURIComponent(
      studentId
    )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    fetchApi(url)
      .then((d: StudentAttendanceDetailDto) => {
        setDetail(d);
      })
      .catch((e: Error) => {
        setError(e.message || "Failed to load");
        setDetail(null);
      })
      .finally(() => setLoading(false));
  }, [studentId, fromDate, toDate]);

  const previewRows = useMemo(
    () =>
      detail?.records.map((r) => [
        new Date(r.date).toLocaleDateString(),
        r.periodNumber != null ? String(r.periodNumber) : "-",
        r.status,
      ]) ?? [],
    [detail]
  );

  return (
    <div className="space-y-4">
      <DashboardHeader />
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {detail?.studentName || "Student Attendance Detail"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {detail?.className ? `${detail.className} • ` : ""}
              From {fromDate} to {toDate}
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl gap-2 shadow-sm"
            onClick={() => setShowDownload(true)}
            disabled={!detail || detail.records.length === 0}
          >
            <Download className="h-4 w-4" /> Export student report
          </Button>
        </div>

        <Card className="rounded-[20px] shadow-sm border-border bg-card/50">
          <CardContent className="p-5 flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                From
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                To
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="rounded-[20px] border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ) : !detail || detail.records.length === 0 ? (
          <Card className="rounded-[20px] shadow-sm border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center h-64">
              <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-foreground">
                No attendance records found
              </p>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Adjust the date range and try again.
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="rounded-[20px] shadow-card overflow-hidden border-border">
              <div className="px-6 pt-4 pb-2 flex flex-wrap gap-4 text-sm border-b border-border/60 bg-muted/20">
                <div>
                  <span className="text-muted-foreground">Present</span>
                  <div className="font-semibold text-foreground">
                    {detail.presentDays}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Absent</span>
                  <div className="font-semibold text-foreground">
                    {detail.absentDays}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total</span>
                  <div className="font-semibold text-foreground">
                    {detail.totalDays}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Percentage</span>
                  <div
                    className={`font-semibold ${
                      detail.percentage >= 75
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {detail.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-4 text-left font-semibold text-muted-foreground">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-muted-foreground">
                        Period
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.records.map((r, idx) => (
                      <tr
                        key={`${r.date}-${r.periodNumber ?? "all"}-${idx}`}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="px-6 py-3">
                          {new Date(r.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3">
                          {r.periodNumber != null ? r.periodNumber : "—"}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={
                              r.status === "Present" || r.status === "Late"
                                ? "text-success font-medium"
                                : r.status === "Absent"
                                ? "text-destructive font-medium"
                                : "text-foreground"
                            }
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        <DownloadModal
          open={showDownload}
          onClose={() => setShowDownload(false)}
          title="Student Attendance Detail"
          previewData={{
            headers: ["Date", "Period", "Status"],
            rows: previewRows,
          }}
        />
      </div>
    </div>
  );
};

export default StudentAttendanceDetail;

