import { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

interface SubjectDto {
  id: string;
  name: string;
  code?: string;
}

interface TeacherDto {
  id: string;
  name: string;
  userId: string;
  registerNumber?: string;
  subject?: string;
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

const getStatusBadge = (status: string) => {
  if (status === "Active") return { label: "Active", variant: "success" as const };
  return { label: status || "Inactive", variant: "secondary" as const };
};

export default function Teachers() {
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileDto | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<TeacherDto | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", phone: "", registerNumber: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");

  useEffect(() => { 
    fetchTeachers(); 
    loadSchoolProfile();
  }, []);

  useEffect(() => {
    fetchApi("/Subjects")
      .then((list: SubjectDto[]) => setSubjects(Array.isArray(list) ? list : []))
      .catch(() => setSubjects([]));
  }, []);

  const loadSchoolProfile = async () => {
    try {
      const profile = (await fetchApi("/SchoolProfile")) as SchoolProfileDto | null;
      setSchoolProfile(profile);
    } catch {
      setSchoolProfile(null);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = (await fetchApi("/Users?role=teacher")) as TeacherDto[];
      setTeachers((Array.isArray(data) ? data : []).map((teacher) => ({
        ...teacher,
        registerNumber: teacher.registerNumber || teacher.userId,
        status: teacher.status || (teacher.isActive === false ? "Inactive" : "Active"),
      })));
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch teachers", variant: "destructive" });
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      t.name.toLowerCase().includes(searchLower) ||
      (t.registerNumber && t.registerNumber.toLowerCase().includes(searchLower)) ||
      (t.subject && t.subject.toLowerCase().includes(searchLower)) ||
      (t.phone && t.phone.includes(searchQuery));
    const matchesSubject = selectedSubject === "All" || t.subject === selectedSubject;
    return matchesSearch && matchesSubject;
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

    const rows = filteredTeachers.map((t, i) => {
      const statusClass = t.status === "Active" ? "status-active" : "status-inactive";
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${t.name}</td>
          <td>${t.registerNumber || t.userId}</td>
          <td>${t.subject || "—"}</td>
          <td>${t.phone || "—"}</td>
          <td class="${statusClass}">${t.status}</td>
        </tr>
      `;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Teacher List</title>
  <style>${printCss}</style>
</head>
<body>
  <div class="print-top-bar">
    <span>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span>
    <span>Teacher Directory Report</span>
  </div>

  <div class="print-header">
    <img src="${logoUrl}" alt="School" class="print-logo" />
    <div>
      <h1 class="print-school-name">${schoolName}</h1>
      <p class="print-report-title">TEACHER DIRECTORY</p>
    </div>
  </div>
  
  <div class="print-line"></div>
  
  <div class="print-meta">
    <div><strong>Total Teachers:</strong> ${filteredTeachers.length}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Register No</th>
        <th>Subject</th>
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

  const columns: DataTableColumn<TeacherDto>[] = [
    {
      key: "name",
      header: "Name",
      cell: (t) => <span className="font-semibold capitalize text-slate-700 dark:text-slate-200">{t.name}</span>,
    },
    {
      key: "regNo",
      header: "Reg No",
      cell: (t) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{t.registerNumber ?? t.userId}</span>,
    },
    {
      key: "subject",
      header: "Subject",
      badge: (t) => t.subject ? { label: t.subject, variant: "violet" } : null,
    },
    {
      key: "phone",
      header: "Phone",
      cell: (t) => <span className="text-slate-600 dark:text-slate-400">{t.phone || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      badge: (t) => getStatusBadge(t.status),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      className: "w-[100px]",
      cell: (t) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEdit(t)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => handleDelete(t)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const openEdit = (t: TeacherDto) => {
    setEditTeacher(t);
    setForm({ name: t.name, subject: t.subject || "", phone: t.phone || "", registerNumber: t.registerNumber || t.userId || "" });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditTeacher(null);
    setForm({ name: "", subject: "", phone: "", registerNumber: "" });
    setShowModal(true);
  };

  const handleDelete = async (t: TeacherDto) => {
    try {
      await fetchApi(`/Users/${t.id}`, { method: "PUT", body: JSON.stringify({ name: t.name, role: "teacher", isActive: false }) });
      toast({ title: "Teacher deactivated", description: "Teacher has been deactivated." });
      fetchTeachers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to deactivate teacher", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const registerNumber = form.registerNumber.trim();
    const subject = form.subject.trim();
    const phone = form.phone.trim();

    if (!name || (!editTeacher && !registerNumber)) {
      toast({
        title: "Validation",
        description: "Name and Register Number are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editTeacher) {
        await fetchApi(`/Users/${editTeacher.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            role: "teacher",
            isActive: editTeacher.isActive !== false,
            phone: phone || undefined,
            subject: subject || undefined,
          }),
        });
      } else {
        await fetchApi("/Users", {
          method: "POST",
          body: JSON.stringify({
            userId: registerNumber,
            password: registerNumber,
            name,
            role: "teacher",
            phone: phone || undefined,
            subject: subject || undefined,
          }),
        });
      }

      toast({
        title: "Saved",
        description: editTeacher ? "Teacher updated successfully" : "Teacher added successfully",
      });
      setShowModal(false);
      await fetchTeachers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save teacher",
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
              placeholder="Search teachers..."
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
          <div className="w-[200px]">
            <SearchableSelect 
              value={selectedSubject} 
              onValueChange={setSelectedSubject} 
              placeholder="Filter by subject" 
              options={[{ value: "All", label: "All Subjects" }, ...subjects.map(s => ({ value: s.name, label: s.name }))]} 
            />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={openAdd} className="gap-2 gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Add Teacher
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredTeachers}
        columns={columns}
        keyExtractor={(t) => t.id}
        emptyMessage="No teachers found"
        emptyDescription="Try adjusting filters or add a new teacher"
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md flex max-h-[90vh] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
            <DialogTitle>{editTeacher ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-1">
                <Label>Register Number</Label>
                <Input value={form.registerNumber} onChange={e => setForm(p => ({ ...p, registerNumber: e.target.value }))} placeholder="Reg. no. used as login username" disabled={!!editTeacher} />
                <span className="text-xs text-muted-foreground">(Username)</span>
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <SearchableSelect value={form.subject || ""} onValueChange={v => setForm(p => ({ ...p, subject: v }))} placeholder="Select subject" options={subjects.map(s => ({ value: s.name, label: s.name + (s.code ? ` (${s.code})` : "") }))} />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editTeacher ? "Update Teacher" : "Add Teacher"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
