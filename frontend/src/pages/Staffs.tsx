import { useState, useEffect } from "react";
import { Search, Plus, Pencil, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

interface StaffDto {
  id: string;
  name: string;
  userId: string;
  registerNumber?: string;
  subject?: string; // Reused as Designation
  phone?: string;
  isActive?: boolean;
  status: string;
}

interface SchoolProfileDto {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
}

const isStaffActive = (staff: StaffDto) => staff.status ? staff.status === "Active" : staff.isActive !== false;

export default function Staffs() {
  const [staffs, setStaffs] = useState<StaffDto[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileDto | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffDto | null>(null);
  const [form, setForm] = useState({ name: "", designation: "", phone: "", username: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusChange, setStatusChange] = useState<{ staff: StaffDto; isActive: boolean } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => { 
    fetchStaffs(); 
    loadSchoolProfile();
  }, []);

  const loadSchoolProfile = async () => {
    try {
      const profile = (await fetchApi("/SchoolProfile")) as SchoolProfileDto | null;
      setSchoolProfile(profile);
    } catch {
      setSchoolProfile(null);
    }
  };

  const fetchStaffs = async () => {
    try {
      const data = (await fetchApi("/Users?role=staff")) as StaffDto[];
      setStaffs((Array.isArray(data) ? data : []).map((staff) => ({
        ...staff,
        registerNumber: staff.registerNumber || staff.userId,
        status: staff.status || (staff.isActive === false ? "Inactive" : "Active"),
      })));
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch staff members", variant: "destructive" });
    }
  };

  const filteredStaffs = staffs.filter(s => {
    const searchLower = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(searchLower) ||
      (s.registerNumber && s.registerNumber.toLowerCase().includes(searchLower)) ||
      (s.subject && s.subject.toLowerCase().includes(searchLower)) ||
      (s.phone && s.phone.includes(searchQuery))
    );
  });

  const handlePrint = async () => {
    let profile = schoolProfile;
    if (!profile) {
      try {
        profile = (await fetchApi("/SchoolProfile")) as SchoolProfileDto | null;
      } catch {
        profile = null;
      }
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Error", description: "Could not open print window. Please allow popups.", variant: "destructive" });
      return;
    }

    const schoolName = profile?.name || "Studyzone Private Institute";
    const logoUrl = profile?.logoUrl || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");

    const printCss = `
      @page { size: A4 landscape; margin: 15mm; }
      body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 10pt; }
      .print-top-bar { display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; margin-bottom: 1rem; }
      .print-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
      .print-logo { height: 60px; width: 60px; object-fit: contain; }
      .print-school-name { margin: 0; font-size: 1.3rem; font-weight: bold; }
      .print-report-title { margin: 0; font-size: 0.9rem; color: #666; letter-spacing: 0.1em; }
      .print-line { border-bottom: 2px solid #000; margin: 0.5rem 0 1rem 0; }
      .print-meta { font-size: 0.9rem; color: #333; margin-bottom: 1rem; }
      .print-meta strong { font-weight: 600; }
      table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 1rem; }
      th, td { padding: 8px; text-align: left; border: 1px solid #999; }
      th { background: #f0f0f0; font-weight: 600; text-transform: uppercase; font-size: 8pt; }
      tr:nth-child(even) { background: #fafafa; }
      .status-active { color: #16a34a; font-weight: 500; }
      .status-inactive { color: #666; }
      .print-footer { margin-top: 2rem; border-top: 1px solid #ccc; padding-top: 1rem; }
      .print-footer-row { display: flex; justify-content: space-between; text-align: center; }
      .print-footer-col { flex: 1; }
      .print-footer-label { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
      .print-footer-value { font-size: 0.8rem; font-weight: 600; color: #333; }
      .print-page-num { text-align: right; font-size: 0.75rem; color: #999; margin-top: 0.5rem; }
    `;

    const rows = filteredStaffs.map((s, i) => {
      const statusClass = s.status === "Active" ? "status-active" : "status-inactive";
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${s.name}</td>
          <td>${s.registerNumber || s.userId}</td>
          <td>${s.subject || "—"}</td>
          <td>${s.phone || "—"}</td>
          <td class="${statusClass}">${s.status}</td>
        </tr>
      `;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Staff List</title>
  <style>${printCss}</style>
</head>
<body>
  <div class="print-top-bar">
    <span>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span>
    <span>Staff Directory Report</span>
  </div>

  <div class="print-header">
    <img src="${logoUrl}" alt="School" class="print-logo" />
    <div>
      <h1 class="print-school-name">${schoolName}</h1>
      <p class="print-report-title">STAFF DIRECTORY</p>
    </div>
  </div>
  
  <div class="print-line"></div>
  
  <div class="print-meta">
    <div><strong>Total Staff Members:</strong> ${filteredStaffs.length}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Username</th>
        <th>Designation</th>
        <th>Phone</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="print-footer">
    <div class="print-footer-row">
      <div class="print-footer-col">
        <div class="print-footer-label">Prepared By</div>
        <div class="print-footer-value">${schoolName}</div>
      </div>
      <div class="print-footer-col">
        <div class="print-footer-label">Checked By</div>
        <div class="print-footer-value">${schoolName}</div>
      </div>
      <div class="print-footer-col">
        <div class="print-footer-label">Administration</div>
        <div class="print-footer-value">${schoolName}</div>
      </div>
    </div>
    <div class="print-page-num">Page 1 of 1</div>
  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(() => window.close(), 1000);
    };
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const columns: DataTableColumn<StaffDto>[] = [
    {
      key: "name",
      header: "Name",
      cell: (s) => <span className="font-semibold capitalize text-slate-700 dark:text-slate-200">{s.name}</span>,
    },
    {
      key: "regNo",
      header: "Username",
      cell: (s) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{s.registerNumber ?? s.userId}</span>,
    },
    {
      key: "designation",
      header: "Designation",
      badge: (s) => s.subject ? { label: s.subject, variant: "sky" } : null,
    },
    {
      key: "phone",
      header: "Phone",
      cell: (s) => <span className="text-slate-600 dark:text-slate-400">{s.phone || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (s) => {
        const isActive = isStaffActive(s);
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setStatusChange({ staff: s, isActive: checked })}
              aria-label={`Mark ${s.name} as ${isActive ? "inactive" : "active"}`}
            />
            <span className={isActive ? "text-xs font-medium text-green-700" : "text-xs font-medium text-slate-500"}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-[50px]",
      cell: (s) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEdit(s)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const openEdit = (s: StaffDto) => {
    setEditStaff(s);
    setForm({ name: s.name, designation: s.subject || "", phone: s.phone || "", username: s.registerNumber || s.userId || "" });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditStaff(null);
    setForm({ name: "", designation: "", phone: "", username: "" });
    setShowModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusChange) return;

    const { staff, isActive } = statusChange;
    setStatusUpdating(true);

    try {
      await fetchApi(`/Users/${staff.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: staff.name,
          role: "staff",
          isActive,
          phone: staff.phone || undefined,
          subject: staff.subject || undefined, // subject stores Designation
        }),
      });
      toast({
        title: "Status updated",
        description: `${staff.name} is now ${isActive ? "active" : "inactive"}.`,
      });
      setStatusChange(null);
      await fetchStaffs();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update staff status", variant: "destructive" });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const username = form.username.trim();
    const designation = form.designation.trim();
    const phone = form.phone.trim();

    if (!name || (!editStaff && !username)) {
      toast({
        title: "Validation",
        description: "Name and Username are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editStaff) {
        await fetchApi(`/Users/${editStaff.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            role: "staff",
            isActive: editStaff.isActive !== false,
            phone: phone || undefined,
            subject: designation || undefined,
          }),
        });
      } else {
        await fetchApi("/Users", {
          method: "POST",
          body: JSON.stringify({
            userId: username,
            password: username,
            name,
            role: "staff",
            phone: phone || undefined,
            subject: designation || undefined,
          }),
        });
      }

      toast({
        title: "Saved",
        description: editStaff ? "Staff updated successfully" : "Staff added successfully",
      });
      setShowModal(false);
      await fetchStaffs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save staff",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search staff members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={openAdd} className="gap-2 gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredStaffs}
        columns={columns}
        keyExtractor={(s) => s.id}
        emptyMessage="No staff members found"
        emptyDescription="Try adjusting filters or add a new staff member"
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md flex max-h-[90vh] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
            <DialogTitle>{editStaff ? "Edit Staff" : "Add Staff"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-1">
                <Label>Username</Label>
                <Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="Login ID" disabled={!!editStaff} />
                <span className="text-xs text-muted-foreground">(Username)</span>
              </div>
              <div className="space-y-1">
                <Label>Designation / Department</Label>
                <Input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} placeholder="e.g. Admin, Accountant" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editStaff ? "Update Staff" : "Add Staff"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!statusChange}
        onOpenChange={(open) => {
          if (!open && !statusUpdating) setStatusChange(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusChange?.isActive ? "Activate staff?" : "Deactivate staff?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusChange
                ? `Are you sure you want to mark ${statusChange.staff.name} as ${statusChange.isActive ? "Active" : "Inactive"}?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange} disabled={statusUpdating}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
