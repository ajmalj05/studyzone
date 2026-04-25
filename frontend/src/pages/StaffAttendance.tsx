import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, XCircle, Clock, Download, Plus, Pencil, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { DownloadModal } from "@/components/DownloadModal";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

interface TeacherAttendanceItemDto {
  teacherUserId: string;
  teacherName: string;
  registerNumber?: string;
  subject?: string;
  status: string;
}

interface TeacherDto {
  id: string;
  name: string;
  userId: string;
  subject?: string;
}

const STAFF_ATTENDANCE_STATUSES = ["Present", "Absent", "Late"];

export default function StaffAttendance() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  const handleDateChange = (val: string) => {
    // If date is cleared or empty, reset to today
    if (!val) {
      setDate(new Date().toISOString().slice(0, 10));
    } else {
      setDate(val);
    }
  };
  const [teachers, setTeachers] = useState<TeacherAttendanceItemDto[]>([]);
  const [allTeachers, setAllTeachers] = useState<TeacherDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherAttendanceItemDto | null>(null);
  const [editStatus, setEditStatus] = useState<string>("Present");
  
  // New attendance modal state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newStatus, setNewStatus] = useState("Present");

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const dateObj = new Date(date + "T12:00:00");
      const list = (await fetchApi(`/Attendance/teachers?date=${dateObj.toISOString()}`)) as TeacherAttendanceItemDto[];
      
      // Merge with allTeachers to get proper register numbers
      const merged = list.map((attendanceItem: TeacherAttendanceItemDto) => {
        const fullTeacher = allTeachers.find(t => t.id === attendanceItem.teacherUserId);
        return {
          ...attendanceItem,
          registerNumber: fullTeacher?.userId || attendanceItem.teacherUserId,
        };
      });
      
      setTeachers(Array.isArray(merged) ? merged : []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to fetch teachers", variant: "destructive" });
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTeachers = async () => {
    try {
      const data = await fetchApi("/Users?role=teacher");
      setAllTeachers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to fetch teacher list", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadTeachers();
    loadAllTeachers();
  }, [date]);

  const openEditModal = (teacher: TeacherAttendanceItemDto) => {
    setEditingTeacher(teacher);
    setEditStatus(teacher.status || "Present");
    setEditModalOpen(true);
  };

  const openDetailPage = (teacher: TeacherAttendanceItemDto) => {
    const to = date;
    const fromDateObj = new Date(date + "T12:00:00");
    fromDateObj.setMonth(fromDateObj.getMonth() - 1);
    const from = fromDateObj.toISOString().slice(0, 10);
    navigate(
      `/admin/history/teacher-attendance/${teacher.teacherUserId}?name=${encodeURIComponent(
        teacher.teacherName,
      )}&from=${from}&to=${to}`,
    );
  };

  const handleInlineStatusChange = async (teacher: TeacherAttendanceItemDto, status: string) => {
    const previousStatus = teacher.status;
    setTeachers((items) =>
      items.map((item) =>
        item.teacherUserId === teacher.teacherUserId ? { ...item, status } : item,
      ),
    );

    try {
      await fetchApi("/Attendance/bulk-teacher", {
        method: "POST",
        body: JSON.stringify({
          date: new Date(date + "T12:00:00").toISOString(),
          items: [{ teacherUserId: teacher.teacherUserId, status }],
        }),
      });
      toast({ title: "Success", description: `${teacher.teacherName}'s attendance updated.` });
    } catch (err: any) {
      setTeachers((items) =>
        items.map((item) =>
          item.teacherUserId === teacher.teacherUserId ? { ...item, status: previousStatus } : item,
        ),
      );
      toast({ title: "Error", description: err.message || "Failed to update attendance", variant: "destructive" });
    }
  };

  const handleEditSave = async () => {
    if (!editingTeacher) return;
    
    setSaving(true);
    try {
      await fetchApi("/Attendance/bulk-teacher", {
        method: "POST",
        body: JSON.stringify({
          date: new Date(date + "T12:00:00").toISOString(),
          items: [{ teacherUserId: editingTeacher.teacherUserId, status: editStatus }],
        }),
      });
      toast({ title: "Success", description: "Attendance updated successfully" });
      setEditModalOpen(false);
      loadTeachers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save attendance", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleNewAttendance = async () => {
    if (!selectedTeacherId) {
      toast({ title: "Error", description: "Please select a teacher", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      await fetchApi("/Attendance/bulk-teacher", {
        method: "POST",
        body: JSON.stringify({
          date: new Date(newDate + "T12:00:00").toISOString(),
          items: [{ teacherUserId: selectedTeacherId, status: newStatus }],
        }),
      });
      toast({ title: "Success", description: "Attendance marked successfully" });
      setNewModalOpen(false);
      setSelectedTeacherId("");
      // If the new date matches current view date, refresh the list
      if (newDate === date) {
        loadTeachers();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save attendance", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<TeacherAttendanceItemDto>[] = [
    {
      key: "name",
      header: "Name",
      cell: (t) => (
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {t.teacherName ? t.teacherName.charAt(0).toUpperCase() + t.teacherName.slice(1).toLowerCase() : '-'}
        </span>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      badge: (t) => t.subject ? { label: t.subject, variant: "violet" } : null,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      cell: (t) => (
        <select
          value={t.status || "Present"}
          onChange={(e) => handleInlineStatusChange(t, e.target.value)}
          disabled={saving}
          className={`h-8 rounded-full border px-3 text-xs font-medium outline-none transition-colors ${
            t.status === "Present" ? "border-green-200 bg-green-100 text-green-700" :
            t.status === "Absent" ? "border-red-200 bg-red-100 text-red-700" :
            t.status === "Late" ? "border-amber-200 bg-amber-100 text-amber-700" :
            "border-gray-200 bg-gray-100 text-gray-600"
          }`}
        >
          {STAFF_ATTENDANCE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-[100px]",
      cell: (t) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openDetailPage(t)} title="View detail">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEditModal(t)} title="Edit attendance">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Date</label>
          <DatePicker value={date} onChange={handleDateChange} placeholder="Select date" className="w-[200px]" />
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" className="gap-2 h-10" onClick={() => setShowDownload(true)}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="gap-2 h-10" onClick={() => setNewModalOpen(true)}>
            <Plus className="h-4 w-4" /> New Attendance
          </Button>
        </div>
      </div>

      <DataTable
        data={teachers}
        columns={columns}
        keyExtractor={(t) => t.teacherUserId}
        loading={loading}
        emptyMessage="No attendance records found"
        emptyDescription="No staff attendance marked for this date"
      />

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>
          {editingTeacher && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-full bg-primary/10">
                  <Search className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{editingTeacher.teacherName}</p>
                  <p className="text-sm text-muted-foreground">{editingTeacher.subject || "No subject"}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <DatePicker value={date} onChange={setDate} placeholder="Select date" disabled />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditStatus("Present")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      editStatus === "Present"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Check className="h-4 w-4 inline mr-2" />Present
                  </button>
                  <button
                    onClick={() => setEditStatus("Absent")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      editStatus === "Absent"
                        ? "bg-red-100 text-red-700 border-red-300"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <XCircle className="h-4 w-4 inline mr-2" />Absent
                  </button>
                  <button
                    onClick={() => setEditStatus("Late")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      editStatus === "Late"
                        ? "bg-amber-100 text-amber-700 border-amber-300"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className="h-4 w-4 inline mr-2" />Late
                  </button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Attendance Modal */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Teacher</label>
              <SearchableSelect
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
                placeholder="Search and select teacher..."
                options={allTeachers.map(t => ({ value: t.id, label: t.name }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <DatePicker value={newDate} onChange={setNewDate} placeholder="Select date" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewStatus("Present")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    newStatus === "Present"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Check className="h-4 w-4 inline mr-2" />Present
                </button>
                <button
                  onClick={() => setNewStatus("Absent")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    newStatus === "Absent"
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <XCircle className="h-4 w-4 inline mr-2" />Absent
                </button>
                <button
                  onClick={() => setNewStatus("Late")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    newStatus === "Late"
                      ? "bg-amber-100 text-amber-700 border-amber-300"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Clock className="h-4 w-4 inline mr-2" />Late
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewModalOpen(false)}>Cancel</Button>
            <Button onClick={handleNewAttendance} disabled={saving || !selectedTeacherId}>
              {saving ? "Saving..." : "Mark Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DownloadModal
        open={showDownload}
        onClose={() => setShowDownload(false)}
        title="Staff Attendance"
        previewData={{ headers: ["Name", "Subject", "Status", "Date"], rows: teachers.map(t => [
          t.teacherName ? t.teacherName.charAt(0).toUpperCase() + t.teacherName.slice(1).toLowerCase() : '-',
          t.subject ?? "—",
          t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1).toLowerCase() : '—',
          date
        ]) }}
      />
    </div>
  );
}