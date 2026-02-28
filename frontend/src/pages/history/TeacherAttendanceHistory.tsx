import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar, History, Download } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DownloadModal } from "@/components/DownloadModal";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { DashboardHeader } from "@/components/DashboardHeader";

interface TeacherAttendanceItemDto {
  teacherUserId: string;
  teacherName: string;
  subject?: string;
  status: string;
}

interface AttendanceRecordDto {
  id: string;
  date: string;
  status: string;
}

const TeacherAttendanceHistory = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [showDownload, setShowDownload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adminRecords, setAdminRecords] = useState<TeacherAttendanceItemDto[]>([]);
  const [myRecords, setMyRecords] = useState<AttendanceRecordDto[]>([]);

  useEffect(() => {
    if (isTeacher && user?._id) {
      setLoading(true);
      setError(null);
      const from = new Date(fromDate + "T00:00:00").toISOString();
      const to = new Date(toDate + "T23:59:59").toISOString();
      fetchApi(`/Attendance/teacher/${user._id}?from=${from}&to=${to}`)
        .then((list: AttendanceRecordDto[]) => {
          setMyRecords(Array.isArray(list) ? list : []);
        })
        .catch((e: Error) => setError(e.message || "Failed to load"))
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      setError(null);
      const dateObj = new Date(selectedDate + "T12:00:00").toISOString();
      fetchApi(`/Attendance/teachers?date=${dateObj}`)
        .then((list: TeacherAttendanceItemDto[]) => {
          setAdminRecords(Array.isArray(list) ? list : []);
        })
        .catch((e: Error) => setError(e.message || "Failed to load"))
        .finally(() => setLoading(false));
    }
  }, [isTeacher, user?._id, selectedDate, fromDate, toDate]);

  const filteredAdminRecords = adminRecords.filter(
    (r) => !searchTerm || r.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {isTeacher ? "My Attendance History" : "Teacher Attendance History"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isTeacher ? "View your attendance records in the selected date range." : "View teacher attendance by date."}
          </p>
        </div>
        <Button variant="outline" className="rounded-xl gap-2 shadow-sm" onClick={() => setShowDownload(true)}>
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <Card className="rounded-[20px] shadow-sm border-border bg-card/50">
        <CardContent className="p-5 flex flex-wrap gap-4 items-center">
          {isTeacher ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-xl border-border bg-background shadow-sm h-10"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-xl border-border bg-background shadow-sm h-10"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <label className="text-xs font-semibold text-muted-foreground">Search Teacher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 rounded-xl border-border bg-background shadow-sm h-10"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <label className="text-xs font-semibold text-muted-foreground">Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border-border bg-background shadow-sm h-10"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="rounded-[20px] border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="rounded-[20px] shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : isTeacher ? (
        <Card className="rounded-[20px] shadow-card overflow-hidden border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 text-left font-semibold text-muted-foreground">Date</th>
                  <th className="px-6 py-4 text-right font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {myRecords.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">
                      No attendance records in this range.
                    </td>
                  </tr>
                ) : (
                  myRecords.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/10">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {format(new Date(r.date), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            r.status === "Present" || r.status === "Late"
                              ? "bg-success/15 text-success"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : filteredAdminRecords.length === 0 ? (
        <Card className="rounded-[20px] shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center h-64">
            <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">No teacher attendance found</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Select a date or adjust the search to view records.
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-3 px-1 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-sidebar flex items-center justify-center shadow-sm">
              <Calendar className="h-5 w-5 text-sidebar-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {format(new Date(selectedDate), "MMMM dd, yyyy")}
              </h2>
              <p className="text-xs text-muted-foreground">{filteredAdminRecords.length} teachers</p>
            </div>
          </div>
          <Card className="rounded-[20px] shadow-card overflow-hidden border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-4 text-left font-semibold text-muted-foreground">Teacher Name</th>
                    <th className="px-6 py-4 text-left font-semibold text-muted-foreground">Subject</th>
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminRecords.map((teacher) => (
                    <tr
                      key={teacher.teacherUserId}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/10"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {teacher.teacherName.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground">{teacher.teacherName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{teacher.subject ?? "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            teacher.status === "Present" || teacher.status === "Late"
                              ? "bg-success/15 text-success"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {teacher.status}
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
        title={isTeacher ? "My Attendance History" : "Teacher Attendance History"}
        previewData={{
          headers: isTeacher ? ["Date", "Status"] : ["Date", "Name", "Subject", "Status"],
          rows: isTeacher
            ? myRecords.map((r) => [format(new Date(r.date), "yyyy-MM-dd"), r.status])
            : filteredAdminRecords.map((r) => [
                selectedDate,
                r.teacherName,
                r.subject ?? "—",
                r.status,
              ]),
        }}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <DashboardHeader />
      {content}
    </div>
  );
};

export default TeacherAttendanceHistory;
