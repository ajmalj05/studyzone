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
import { cn } from "@/lib/utils";

interface StaffAttendanceItemDto {
  staffUserId: string;
  staffName: string;
  registerNumber?: string;
  subject?: string; // Designation
  status: string;
}

interface StaffDto {
  id: string;
  name: string;
  userId: string;
  subject?: string;
}

type AttendanceStatus = "" | "Present" | "Absent" | "Late";
const ATTENDANCE_STATUSES: AttendanceStatus[] = ["Present", "Absent", "Late"];

export default function ActualStaffAttendance() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  const handleDateChange = (val: string) => {
    if (!val) {
      setDate(new Date().toISOString().slice(0, 10));
    } else {
      setDate(val);
    }
  };
  const [staffList, setStaffList] = useState<StaffAttendanceItemDto[]>([]);
  const [allStaff, setAllStaff] = useState<StaffDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAttendanceItemDto | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>("");
  
  // New attendance modal state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newStatus, setNewStatus] = useState<AttendanceStatus>("");

  const loadStaffAttendance = async () => {
    setLoading(true);
    try {
      const dateObj = new Date(date + "T12:00:00");
      const list = (await fetchApi(`/Attendance/staffs?date=${dateObj.toISOString()}`)) as StaffAttendanceItemDto[];
      
      const merged = list.map((item: StaffAttendanceItemDto) => {
        const fullStaff = allStaff.find(s => s.id === item.staffUserId);
        return {
          ...item,
          registerNumber: fullStaff?.userId || item.staffUserId,
          subject: item.subject || fullStaff?.subject
        };
      });
      
      setStaffList(Array.isArray(merged) ? merged : []);
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to fetch staff attendance", variant: "destructive" });
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllStaff = async () => {
    try {
      const data = await fetchApi("/Users?role=staff");
      setAllStaff(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to fetch staff list", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadAllStaff();
  }, []);

  useEffect(() => {
    loadStaffAttendance();
  }, [date, allStaff]);

  const openEditModal = (staff: StaffAttendanceItemDto) => {
    setEditingStaff(staff);
    setEditStatus((staff.status as AttendanceStatus) || "");
    setEditModalOpen(true);
  };

  const openDetailPage = (staff: StaffAttendanceItemDto) => {
    const to = date;
    const fromDateObj = new Date(date + "T12:00:00");
    fromDateObj.setMonth(fromDateObj.getMonth() - 1);
    const from = fromDateObj.toISOString().slice(0, 10);
    navigate(
      `/admin/history/staff-attendance/${staff.staffUserId}?name=${encodeURIComponent(
        staff.staffName,
      )}&from=${from}&to=${to}`,
    );
  };

  const handleInlineStatusChange = async (staff: StaffAttendanceItemDto, status: AttendanceStatus) => {
    const previousStatus = staff.status;
    setStaffList((items) =>
      items.map((item) =>
        item.staffUserId === staff.staffUserId ? { ...item, status } : item,
      ),
    );

    try {
      await fetchApi("/Attendance/bulk-staff", {
        method: "POST",
        body: JSON.stringify({
          date: new Date(date + "T12:00:00").toISOString(),
          items: [{ staffUserId: staff.staffUserId, status }],
        }),
      });
      toast({ title: "Success", description: `${staff.staffName}'s attendance updated.` });
    } catch (err: unknown) {
      setStaffList((items) =>
        items.map((item) =>
          item.staffUserId === staff.staffUserId ? { ...item, status: previousStatus } : item,
        ),
      );
      toast({ title: "Error", description: (err as Error).message || "Failed to update attendance", variant: "destructive" });
    }
  };

  const statusButtonClass = (isSelected: boolean, status: AttendanceStatus) =>
    cn(
      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
      !isSelected && "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      isSelected &&
        (status === "Present"
          ? "border-green-300 bg-green-100 text-green-700"
          : status === "Absent"
            ? "border-red-300 bg-red-100 text-red-700"
            : "border-amber-300 bg-amber-100 text-amber-700"),
    );

  const handleEditSave = async () => {
    if (!editingStaff) return;
    if (!editStatus) {
      toast({ title: "Validation", description: "Please select attendance status", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      await fetchApi("/Attendance/bulk-staff", {
        method: "POST",
        body: JSON.stringify({
          date: new Date(date + "T12:00:00").toISOString(),
          items: [{ staffUserId: editingStaff.staffUserId, status: editStatus }],
        }),
      });
      toast({ title: "Success", description: "Attendance updated successfully" });
      setEditModalOpen(false);
      loadStaffAttendance();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to save attendance", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleNewAttendance = async () => {
    if (!selectedStaffId) {
      toast({ title: "Error", description: "Please select a staff member", variant: "destructive" });
      return;
    }
    if (!newStatus) {
      toast({ title: "Validation", description: "Please select attendance status", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      await fetchApi("/Attendance/bulk-staff", {
        method: "POST",
        body: JSON.stringify({
          date: new Date(newDate + "T12:00:00").toISOString(),
          items: [{ staffUserId: selectedStaffId, status: newStatus }],
        }),
      });
      toast({ title: "Success", description: "Attendance marked successfully" });
      setNewModalOpen(false);
      setSelectedStaffId("");
      setNewStatus("");
      if (newDate === date) {
        loadStaffAttendance();
      }
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to save attendance", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<StaffAttendanceItemDto>[] = [
    {
      key: "name",
      header: "Name",
      cell: (s) => (
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {s.staffName ? s.staffName.charAt(0).toUpperCase() + s.staffName.slice(1).toLowerCase() : '-'}
        </span>
      ),
    },
    {
      key: "designation",
      header: "Designation",
      badge: (s) => s.subject ? { label: s.subject, variant: "sky" } : null,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      cell: (s) => (
        <div className="flex justify-center gap-1.5">
          {ATTENDANCE_STATUSES.map((status) => {
            const selected = s.status === status;
            return (
              <button
                key={status}
                type="button"
                disabled={saving}
                onClick={() => handleInlineStatusChange(s, status)}
                className={statusButtonClass(selected, status)}
              >
                <span className={cn("inline-block h-3.5 w-3.5 rounded-[3px] border", selected ? "border-current bg-current/15" : "border-slate-300")} />
                {status}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-[100px]",
      cell: (s) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openDetailPage(s)} title="View detail">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEditModal(s)} title="Edit attendance">
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
        data={staffList}
        columns={columns}
        keyExtractor={(s) => s.staffUserId}
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
          {editingStaff && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-full bg-primary/10">
                  <Search className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{editingStaff.staffName}</p>
                  <p className="text-sm text-muted-foreground">{editingStaff.subject || "No designation"}</p>
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
            <Button onClick={handleEditSave} disabled={saving || !editStatus}>
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
              <label className="text-sm font-medium">Select Staff Member</label>
              <SearchableSelect
                value={selectedStaffId}
                onValueChange={setSelectedStaffId}
                placeholder="Search and select staff..."
                options={allStaff.map(s => ({ value: s.id, label: s.name }))}
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
            <Button onClick={handleNewAttendance} disabled={saving || !selectedStaffId || !newStatus}>
              {saving ? "Saving..." : "Mark Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DownloadModal
        open={showDownload}
        onClose={() => setShowDownload(false)}
        title="Staff Attendance"
        previewData={{ headers: ["Name", "Designation", "Status", "Date"], rows: staffList.map(s => [
          s.staffName ? s.staffName.charAt(0).toUpperCase() + s.staffName.slice(1).toLowerCase() : '-',
          s.subject ?? "—",
          s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase() : "Not marked",
          date
        ]) }}
      />
    </div>
  );
}
