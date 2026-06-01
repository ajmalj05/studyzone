import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, History, UserRound, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DownloadModal } from "@/components/DownloadModal";
import { useOptionalPageHeaderDispatch } from "@/context/PageHeaderContext";
import { fetchApi } from "@/lib/api";

interface AttendanceRecordDto {
  id: string;
  date: string;
  status: string;
}

const StaffAttendanceDetail = () => {
  const { staffUserId } = useParams<{ staffUserId: string }>();
  const [searchParams] = useSearchParams();
  const setPageHeader = useOptionalPageHeaderDispatch();

  const staffName = searchParams.get("name") || "Staff attendance";
  const [fromDate, setFromDate] = useState(() => {
    const queryFrom = searchParams.get("from");
    if (queryFrom) return queryFrom;
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => searchParams.get("to") || new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<AttendanceRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    if (!staffUserId) return;
    setLoading(true);
    setError(null);

    const from = new Date(fromDate + "T00:00:00").toISOString();
    const to = new Date(toDate + "T23:59:59").toISOString();

    fetchApi(`/Attendance/staff/${staffUserId}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((list: AttendanceRecordDto[]) => setRecords(Array.isArray(list) ? list : []))
      .catch((e: Error) => {
        setError(e.message || "Failed to load staff attendance detail");
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, [staffUserId, fromDate, toDate]);

  useEffect(() => {
    if (!setPageHeader) return;
    setPageHeader({
      title: staffName,
      description: `Staff attendance from ${fromDate} to ${toDate}`,
    });
    return () => setPageHeader({});
  }, [staffName, fromDate, toDate, setPageHeader]);

  const summary = useMemo(() => {
    const present = records.filter((r) => r.status === "Present").length;
    const absent = records.filter((r) => r.status === "Absent").length;
    const late = records.filter((r) => r.status === "Late").length;
    const total = records.length;
    const percentage = total > 0 ? ((present + late) / total) * 100 : 0;
    return { present, absent, late, total, percentage };
  }, [records]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Card className="rounded-[20px] border-border bg-card/50 shadow-sm">
          <CardContent className="flex flex-wrap items-end gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">From</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">To</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-10 rounded-xl" />
            </div>
          </CardContent>
        </Card>
        <Button
          variant="outline"
          className="gap-2 rounded-xl shadow-sm"
          onClick={() => setShowDownload(true)}
          disabled={records.length === 0}
        >
          <Download className="h-4 w-4" /> Export staff report
        </Button>
      </div>

      <Card className="rounded-[20px] border-border shadow-sm">
        <CardContent className="p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <UserRound className="h-3.5 w-3.5" /> Staff Name
              </p>
              <p className="text-sm font-semibold text-foreground">{staffName}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <CalendarRange className="h-3.5 w-3.5" /> Selected Range
              </p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Total Entries</p>
              <p className="text-sm font-semibold text-foreground">{summary.total}</p>
            </div>
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
          <CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card className="rounded-[20px] border-dashed shadow-sm">
          <CardContent className="flex h-64 flex-col items-center justify-center p-12 text-center">
            <History className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-lg font-medium text-foreground">No attendance records found</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Adjust the date range and try again.</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden rounded-[20px] border-border shadow-card">
            <div className="flex flex-wrap gap-4 border-b border-border/60 bg-muted/20 px-6 py-4 text-sm">
              <div>
                <span className="text-muted-foreground">Present</span>
                <div className="font-semibold text-foreground">{summary.present}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Late</span>
                <div className="font-semibold text-foreground">{summary.late}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Absent</span>
                <div className="font-semibold text-foreground">{summary.absent}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total</span>
                <div className="font-semibold text-foreground">{summary.total}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Percentage</span>
                <div className={summary.percentage >= 75 ? "font-semibold text-success" : "font-semibold text-destructive"}>
                  {summary.percentage.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-4 text-left font-semibold text-muted-foreground">#</th>
                    <th className="px-6 py-4 text-left font-semibold text-muted-foreground">Day</th>
                    <th className="px-6 py-4 text-left font-semibold text-muted-foreground">Date</th>
                    <th className="px-6 py-4 text-left font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={record.id} className="border-b border-border/50 last:border-0">
                      <td className="px-6 py-3 text-muted-foreground">{index + 1}</td>
                      <td className="px-6 py-3">
                        {new Date(record.date).toLocaleDateString(undefined, { weekday: "short" })}
                      </td>
                      <td className="px-6 py-3">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3">
                        <span
                          className={
                            record.status === "Present"
                              ? "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
                              : record.status === "Late"
                              ? "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
                              : record.status === "Absent"
                              ? "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
                              : "inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground"
                          }
                        >
                          {record.status}
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
        title="Staff Attendance Detail"
        previewData={{
          headers: ["Staff Name", "Day", "Date", "Status"],
          rows: records.map((record) => [
            staffName,
            new Date(record.date).toLocaleDateString(undefined, { weekday: "short" }),
            new Date(record.date).toLocaleDateString(),
            record.status,
          ]),
        }}
      />
    </div>
  );
};

export default StaffAttendanceDetail;
