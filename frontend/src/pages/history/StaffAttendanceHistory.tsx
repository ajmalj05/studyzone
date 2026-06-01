import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar, History, Download } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DownloadModal } from "@/components/DownloadModal";
import { fetchApi } from "@/lib/api";
import { useOptionalPageHeaderDispatch } from "@/context/PageHeaderContext";

interface StaffAttendanceItemDto {
  staffUserId: string;
  staffName: string;
  subject?: string; // Designation
  status: string;
}

const StaffAttendanceHistory = () => {
  const setPageHeader = useOptionalPageHeaderDispatch();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showDownload, setShowDownload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<StaffAttendanceItemDto[]>([]);

  useEffect(() => {
    if (!setPageHeader) return;
    setPageHeader({
      title: "Staff attendance history",
      description: "Review staff attendance by date.",
    });
    return () => setPageHeader({});
  }, [setPageHeader]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const dateObj = new Date(selectedDate + "T12:00:00").toISOString();
    fetchApi(`/Attendance/staffs?date=${dateObj}`)
      .then((list: StaffAttendanceItemDto[]) => {
        setRecords(Array.isArray(list) ? list : []);
      })
      .catch((e: Error) => setError(e.message || "Failed to load staff attendance history"))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const filteredRecords = records.filter(
    (r) => !searchTerm || r.staffName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" className="rounded-xl gap-2 shadow-sm" onClick={() => setShowDownload(true)}>
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <Card className="rounded-[20px] shadow-sm border-border bg-card/50">
        <CardContent className="p-5 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1.5 w-full sm:w-auto flex-1 sm:flex-none">
            <label className="text-xs font-semibold text-muted-foreground">Search Staff</label>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-xl border-border bg-background shadow-sm h-10 w-full"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-xs font-semibold text-muted-foreground">Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border-border bg-background shadow-sm h-10 w-[200px]"
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
        <Card className="rounded-[20px] shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : filteredRecords.length === 0 ? (
        <Card className="rounded-[20px] shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center h-64">
            <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground">No staff attendance found</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Select another date or adjust the search query.
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
              <p className="text-xs text-muted-foreground">{filteredRecords.length} staff members</p>
            </div>
          </div>
          <Card className="rounded-[20px] shadow-card overflow-hidden border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-4 text-left font-semibold text-muted-foreground">Staff Member</th>
                    <th className="px-6 py-4 text-left font-semibold text-muted-foreground">Designation</th>
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((staff) => (
                    <tr
                      key={staff.staffUserId}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/10"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {staff.staffName.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground">{staff.staffName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{staff.subject ?? "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            staff.status === "Present" || staff.status === "Late"
                              ? "bg-success/15 text-success"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {staff.status || "Not marked"}
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
        title="Staff Attendance History"
        previewData={{
          headers: ["Date", "Name", "Designation", "Status"],
          rows: filteredRecords.map((r) => [
            selectedDate,
            r.staffName,
            r.subject ?? "—",
            r.status || "Not marked",
          ]),
        }}
      />
    </div>
  );
};

export default StaffAttendanceHistory;
