import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Search, Plus, Filter, MoreVertical, Edit, Trash2, Download, Check, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DownloadModal } from "@/components/DownloadModal";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

interface SubjectDto {
  id: string;
  name: string;
  code?: string;
}

export default function Teachers() {
  const [activeTab, setActiveTab] = useState<"list" | "attendance">("list");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<any | null>(null);
  const [showDownload, setShowDownload] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", phone: "", registerNumber: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [salaryForm, setSalaryForm] = useState({
    salaryAmount: "",
    salaryEffectiveFrom: new Date().toISOString().slice(0, 10),
    salaryEffectiveTo: "",
    salaryPayFrequency: "Monthly" as "Monthly" | "Weekly",
    salaryNotes: "",
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchApi("/Subjects")
      .then((list: SubjectDto[]) => setSubjects(Array.isArray(list) ? list : []))
      .catch(() => setSubjects([]));
  }, []);

  const fetchTeachers = async () => {
    try {
      const data = await fetchApi('/Users?role=teacher');
      setTeachers(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch teachers", variant: "destructive" });
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "All" || t.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const openEdit = (t: any) => {
    setEditTeacher(t);
    setForm({ name: t.name, subject: t.subject || "", phone: t.phone || "", registerNumber: t.registerNumber || t.userId || "" });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditTeacher(null);
    setForm({ name: "", subject: "", phone: "", registerNumber: "" });
    setSalaryForm({
      salaryAmount: "",
      salaryEffectiveFrom: new Date().toISOString().slice(0, 10),
      salaryEffectiveTo: "",
      salaryPayFrequency: "Monthly",
      salaryNotes: "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.registerNumber || !form.phone) {
      toast({ title: "Validation Error", description: "Name, Subject, Phone, and Register Number are required.", variant: "destructive" });
      return;
    }
    if (!editTeacher) {
      const amount = parseFloat(salaryForm.salaryAmount);
      if (salaryForm.salaryAmount === "" || isNaN(amount) || amount <= 0) {
        toast({ title: "Validation Error", description: "Salary package is required. Enter a valid amount (greater than 0).", variant: "destructive" });
        return;
      }
    }
    try {
      if (editTeacher) {
        await fetchApi(`/Users/${editTeacher.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.name,
            role: "teacher",
            isActive: editTeacher.isActive ?? true,
            phone: form.phone || undefined,
            subject: form.subject || undefined,
          })
        });
        toast({ title: "Teacher Updated", description: `${form.name} has been updated.` });
      } else {
        const createdUser = await fetchApi('/Users', {
          method: 'POST',
          body: JSON.stringify({
            userId: form.registerNumber,
            password: form.registerNumber,
            name: form.name,
            role: "teacher",
            phone: form.phone || undefined,
            subject: form.subject || undefined,
          })
        }) as { id: string };
        const amount = parseFloat(salaryForm.salaryAmount);
          await fetchApi("/TeacherSalary", {
            method: "POST",
            body: JSON.stringify({
              teacherUserId: createdUser.id,
              effectiveFrom: salaryForm.salaryEffectiveFrom + "T00:00:00Z",
              effectiveTo: salaryForm.salaryEffectiveTo ? salaryForm.salaryEffectiveTo + "T00:00:00Z" : null,
              amount,
              payFrequency: salaryForm.salaryPayFrequency,
              currency: "INR",
              notes: salaryForm.salaryNotes || undefined,
            }),
          });
          toast({ title: "Teacher Added", description: `${form.name} has been added with salary package.` });
      }
      fetchTeachers();
      setShowModal(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Operation failed", variant: "destructive" });
    }
  };

  const handleDelete = async (t: any) => {
    try {
      await fetchApi(`/Users/${t.id}`, { method: 'PUT', body: JSON.stringify({ name: t.name, role: t.role, isActive: false }) });
      toast({ title: "Teacher deactivated", description: "Teacher has been deactivated." });
      fetchTeachers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to deactivate teacher", variant: "destructive" });
    }
  };

  const toggleAttendance = (id: string) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, attendance: t.attendance === "Present" ? "Absent" : "Present" } : t));
  };

  const handleSaveAttendance = () => {
    toast({ title: "Attendance Saved", description: "Teacher attendance records updated successfully." });
  };

  return (
    <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DashboardHeader title="Teaching Staff" description="Manage teachers and staff attendance" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowDownload(true)}>
              <Download className="h-4 w-4" /> Export
            </Button>
            {activeTab === "list" && (
              <Button onClick={openAdd} className="gap-2 gradient-primary text-primary-foreground">
                <Plus className="h-4 w-4" /> Add Teacher
              </Button>
            )}
            {activeTab === "attendance" && (
              <Button onClick={handleSaveAttendance} className="gap-2 bg-success text-white hover:bg-success/90">
                <Check className="h-4 w-4" /> Save Attendance
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === "list" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Teacher List
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === "attendance" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Staff Attendance
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
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

          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button
              key="All"
              onClick={() => setSelectedSubject("All")}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSubject === "All" ? "gradient-primary text-white shadow-md" : "bg-card text-muted-foreground border border-border hover:bg-muted"}`}
            >
              All
            </button>
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.name)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSubject === s.name ? "gradient-primary text-white shadow-md" : "bg-card text-muted-foreground border border-border hover:bg-muted"}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-x-auto rounded-2xl bg-card shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left font-semibold text-foreground">Name</th>
                <th className="px-6 py-4 text-left font-semibold text-foreground">Reg No</th>
                <th className="px-6 py-4 text-left font-semibold text-foreground">Subject</th>
                <th className="px-6 py-4 text-left font-semibold text-foreground">Classes Assigned</th>
                {activeTab === "list" && (
                  <>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">Phone</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-foreground">Actions</th>
                  </>
                )}
                {activeTab === "attendance" && (
                  <th className="px-6 py-4 text-center font-semibold text-foreground">Attendance</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium text-foreground">{t.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{t.registerNumber ?? t.userId}</td>
                    <td className="px-6 py-4 text-muted-foreground">{t.subject}</td>
                    <td className="px-6 py-4 text-muted-foreground">{t.classesAssigned}</td>

                    {activeTab === "list" && (
                      <>
                        <td className="px-6 py-4 text-muted-foreground">{t.phone}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${t.status === "Active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openEdit(t)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="outline" className="rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </>
                    )}

                    {activeTab === "attendance" && (
                      <td className="px-6 py-4 flex justify-center">
                        <button
                          onClick={() => toggleAttendance(t.id)}
                          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${t.attendance === "Present" ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}
                        >
                          {t.attendance === "Present" ? <Check className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {t.attendance || "Absent"}
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTab === "list" ? 6 : 4} className="px-6 py-8 text-center text-muted-foreground">
                    No teachers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md flex max-h-[90vh] flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
            <DialogTitle>{editTeacher ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
            <DialogDescription>Teacher details and contact.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-1">
                <Label>Register Number</Label>
                <Input value={form.registerNumber} onChange={e => setForm(p => ({ ...p, registerNumber: e.target.value }))} placeholder="Reg. no." disabled={!!editTeacher} />
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select value={form.subject || undefined} onValueChange={v => setForm(p => ({ ...p, subject: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {editTeacher && form.subject && !subjects.some(s => s.name === form.subject) && (
                      <SelectItem value={form.subject}>{form.subject} (current)</SelectItem>
                    )}
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}{s.code ? ` (${s.code})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
              </div>
              {!editTeacher && (
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-sm font-medium text-foreground">Salary package (required)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={salaryForm.salaryAmount}
                        onChange={e => setSalaryForm(s => ({ ...s, salaryAmount: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Pay frequency</Label>
                      <Select
                        value={salaryForm.salaryPayFrequency}
                        onValueChange={(v: "Monthly" | "Weekly") => setSalaryForm(s => ({ ...s, salaryPayFrequency: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Effective from</Label>
                      <Input
                        type="date"
                        value={salaryForm.salaryEffectiveFrom}
                        onChange={e => setSalaryForm(s => ({ ...s, salaryEffectiveFrom: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Effective to (optional)</Label>
                      <Input
                        type="date"
                        value={salaryForm.salaryEffectiveTo}
                        onChange={e => setSalaryForm(s => ({ ...s, salaryEffectiveTo: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Notes (optional)</Label>
                    <Input
                      value={salaryForm.salaryNotes}
                      onChange={e => setSalaryForm(s => ({ ...s, salaryNotes: e.target.value }))}
                      placeholder="Notes"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editTeacher ? "Update Teacher" : "Add Teacher"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DownloadModal open={showDownload} onClose={() => setShowDownload(false)} title="Teacher List" previewData={{ headers: ["Name", "Reg No", "Subject", "Classes", "Phone"], rows: filteredTeachers.map(t => [t.name, t.registerNumber ?? t.userId, t.subject, t.classesAssigned, t.phone]) }} />
    </div>
  );
}
