import { useState, useEffect } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Link2, Unlink, Eye } from "lucide-react";

interface LinkedStudentDto {
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  className?: string;
}

interface ParentWithLinksDto {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  linkedStudents: LinkedStudentDto[];
}

interface StudentOption {
  id: string;
  name: string;
  admissionNumber?: string;
  className?: string;
}

const AdminParentManagement = () => {
  const [parents, setParents] = useState<ParentWithLinksDto[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ userId: "", password: "", name: "" });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [linkingParent, setLinkingParent] = useState<ParentWithLinksDto | null>(null);
  const [selectedStudentToLink, setSelectedStudentToLink] = useState("");
  const [studentPickerValue, setStudentPickerValue] = useState("");
  const [viewingStudents, setViewingStudents] = useState<ParentWithLinksDto | null>(null);
  const [classes, setClasses] = useState<{id: string; name: string}[]>([]);
  const [batches, setBatches] = useState<{id: string; name: string; classId: string}[]>([]);
  const [linkClassFilter, setLinkClassFilter] = useState("");
  const [linkBatchFilter, setLinkBatchFilter] = useState("");
  const [createClassFilter, setCreateClassFilter] = useState("");
  const [createBatchFilter, setCreateBatchFilter] = useState("");

  usePageHeaderConfigEffect(
    { title: "Parent management", description: "Create parent accounts and link students to the parent portal." },
    [],
  );

  const loadParents = async () => {
    try {
      const list = (await fetchApi("/ParentManagement/parents")) as ParentWithLinksDto[];
      setParents(Array.isArray(list) ? list : []);
    } catch {
      setParents([]);
      toast({
        title: "Could not load parents",
        description: "The parent list could not be loaded. You may need to sign in again or check your connection.",
        variant: "destructive",
      });
    }
  };

  const loadStudents = async () => {
    try {
      const res = (await fetchApi("/Students?take=500")) as { items?: StudentOption[] };
      setStudents(Array.isArray(res?.items) ? res.items : []);
    } catch {
      setStudents([]);
    }
  };

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as {id: string; name: string}[];
      setClasses(Array.isArray(list) ? list : []);
    } catch {
      setClasses([]);
    }
  };

  const loadBatches = async () => {
    try {
      const list = (await fetchApi("/Batches")) as {id: string; name: string; classId: string}[];
      setBatches(Array.isArray(list) ? list : []);
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadParents(), loadStudents(), loadClasses(), loadBatches()]);
      setLoading(false);
    })();
  }, []);

  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.userId || !createForm.password || !createForm.name) {
      toast({ title: "Error", description: "Fill Login ID, Password and Full name.", variant: "destructive" });
      return;
    }
    if (selectedStudentIds.length === 0) {
      toast({ title: "Error", description: "Select at least one student to link to this parent.", variant: "destructive" });
      return;
    }
    try {
      const created = (await fetchApi("/Users", {
        method: "POST",
        body: JSON.stringify({
          userId: createForm.userId,
          password: createForm.password,
          name: createForm.name,
          role: "parent",
        }),
      })) as { id?: string; Id?: string };
      // Support both camelCase (id) and PascalCase (Id) from API
      const parentId = created?.id ?? (created as { Id?: string })?.Id;
      if (!parentId) {
        toast({
          title: "Error",
          description: "Parent was created but the response did not include an ID. The parent should still appear in the list below.",
          variant: "destructive",
        });
        setCreateForm({ userId: "", password: "", name: "" });
        setSelectedStudentIds([]);
        setShowCreateForm(false);
        await loadParents();
        return;
      }
      setCreateForm({ userId: "", password: "", name: "" });
      setSelectedStudentIds([]);
      setShowCreateForm(false);
      await loadParents();
      toast({ title: "Success", description: "Parent account created. Linking students…" });
      let linkFailCount = 0;
      for (const studentId of selectedStudentIds) {
        try {
          await fetchApi("/ParentManagement/link", {
            method: "POST",
            body: JSON.stringify({ parentUserId: parentId, studentId }),
          });
        } catch {
          linkFailCount += 1;
        }
      }
      if (linkFailCount > 0) {
        toast({
          title: "Partially done",
          description: `Parent created. ${linkFailCount} of ${selectedStudentIds.length} student link(s) failed. You can link them from the table below.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Parent account created and linked to selected student(s)." });
      }
      await loadParents();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err && typeof (err as { message: string }).message === "string"
          ? (err as { message: string }).message
          : (err as Error)?.message ?? "Failed to create parent.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleLink = async (parentId: string, studentId: string) => {
    if (!studentId) return;
    try {
      await fetchApi("/ParentManagement/link", {
        method: "POST",
        body: JSON.stringify({ parentUserId: parentId, studentId }),
      });
      toast({ title: "Success", description: "Student linked to parent." });
      setLinkingParent(null);
      setSelectedStudentToLink("");
      await loadParents();
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message ?? "Failed to link", variant: "destructive" });
    }
  };

  const handleUnlink = async (parentId: string, studentId: string) => {
    try {
      await fetchApi(
        `/ParentManagement/link?parentUserId=${encodeURIComponent(parentId)}&studentId=${encodeURIComponent(studentId)}`,
        { method: "DELETE" }
      );
      toast({ title: "Success", description: "Student unlinked." });
      await loadParents();
      // Update viewingStudents if modal is open to reflect the change immediately
      if (viewingStudents && viewingStudents.id === parentId) {
        setViewingStudents({
          ...viewingStudents,
          linkedStudents: viewingStudents.linkedStudents.filter(s => s.studentId !== studentId)
        });
      }
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message ?? "Failed to unlink", variant: "destructive" });
    }
  };

  const parentColumns: DataTableColumn<ParentWithLinksDto>[] = [
    {
      key: "userId",
      header: "Parent (Login ID)",
      cell: (p) => <span className="font-medium font-mono text-xs text-slate-600 dark:text-slate-400">{p.userId}</span>,
    },
    {
      key: "name",
      header: "Name",
      cell: (p) => <span className="font-semibold text-slate-700 dark:text-slate-200">{p.name}</span>,
    },
    {
      key: "status",
      header: "Status",
      badge: (p) => ({ label: p.isActive ? "Active" : "Inactive", variant: p.isActive ? "success" : "secondary" }),
    },
    {
      key: "linkedStudents",
      header: "Linked students",
      cell: (p) => {
        const students = p.linkedStudents ?? [];
        const displayCount = 2;
        const hasMore = students.length > displayCount;
        const displayedStudents = students.slice(0, displayCount);
        
        return (
          <div className="space-y-1">
            {displayedStudents.map((s) => (
              <div key={s.studentId} className="flex items-center gap-2 text-sm">
                <span>{s.studentName}{s.className ? ` (${s.className})` : ""}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleUnlink(p.id, s.studentId)}
                >
                  <Unlink className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-primary hover:text-primary"
                onClick={() => setViewingStudents(p)}
              >
                <Eye className="h-3 w-3 mr-1" /> View more (+{students.length - displayCount})
              </Button>
            )}
            {students.length === 0 && (
              <span className="text-muted-foreground text-sm">None</span>
            )}
          </div>
        );
      },
    },
    {
      key: "linkStudent",
      header: "",
      align: "right",
      className: "w-[120px]",
      cell: (p) => (
        <Button variant="outline" size="sm" className="gap-1" onClick={() => { setLinkingParent(p); setSelectedStudentToLink(""); }}>
          <Link2 className="h-4 w-4" /> Link student
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Dialog open={showCreateForm} onOpenChange={(open) => { setShowCreateForm(open); if (!open) { setSelectedStudentIds([]); setStudentPickerValue(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New parent account</DialogTitle>
           </DialogHeader>
          <form onSubmit={handleCreateParent} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Login ID</label>
                <Input
                  value={createForm.userId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, userId: e.target.value }))}
                  placeholder="e.g. P1001"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Password"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Full name</label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Parent name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Link students <span className="text-muted-foreground font-normal">(at least one required)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <SearchableSelect
                  value={createClassFilter}
                  onValueChange={(v) => { setCreateClassFilter(v); setCreateBatchFilter(""); }}
                  placeholder="Filter by class"
                  options={[{ value: "", label: "All Classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
                />
                <SearchableSelect
                  value={createBatchFilter}
                  onValueChange={setCreateBatchFilter}
                  placeholder="Filter by batch"
                  disabled={!createClassFilter}
                  options={[{ value: "", label: "All Batches" }, ...batches.filter((b) => b.classId === createClassFilter).map((b) => ({ value: b.id, label: b.name }))]}
                />
              </div>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students in the system. Add students first.</p>
              ) : (
                <SearchableSelect
                  value={studentPickerValue}
                  onValueChange={(v) => {
                    if (v && !selectedStudentIds.includes(v)) {
                      setSelectedStudentIds((prev) => [...prev, v]);
                    }
                    setStudentPickerValue("");
                  }}
                  placeholder="Search and add a student…"
                  options={students
                    .filter((s) => {
                      if (!createClassFilter) return !selectedStudentIds.includes(s.id);
                      const classMatch = s.className?.includes(classes.find(c => c.id === createClassFilter)?.name || "");
                      return !selectedStudentIds.includes(s.id) && classMatch;
                    })
                    .map((s) => ({ value: s.id, label: `${s.name}${s.admissionNumber ? ` (${s.admissionNumber})` : ""}${s.className ? ` — ${s.className}` : ""}` }))}
                />
              )}
              {selectedStudentIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedStudentIds.map((id) => {
                    const s = students.find((st) => st.id === id);
                    if (!s) return null;
                    return (
                      <span key={id} className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs font-medium">
                        {s.name}{s.className ? ` — ${s.className}` : ""}
                        <button type="button" onClick={() => setSelectedStudentIds((prev) => prev.filter((i) => i !== id))} className="hover:text-destructive transition-colors leading-none">✕</button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); setSelectedStudentIds([]); setStudentPickerValue(""); }}>Cancel</Button>
              <Button type="submit" disabled={students.length === 0 || selectedStudentIds.length === 0}>Create parent & link students</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkingParent} onOpenChange={(open) => { if (!open) { setLinkingParent(null); setSelectedStudentToLink(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link student</DialogTitle>
            <DialogDescription>
              Select a student to link to <span className="font-medium text-foreground">{linkingParent?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Class</label>
                <SearchableSelect
                  value={linkClassFilter}
                  onValueChange={(v) => { setLinkClassFilter(v); setLinkBatchFilter(""); }}
                  placeholder="Select class"
                  options={[{ value: "", label: "All Classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Batch</label>
                <SearchableSelect
                  value={linkBatchFilter}
                  onValueChange={setLinkBatchFilter}
                  placeholder="Select batch"
                  disabled={!linkClassFilter}
                  options={[{ value: "", label: "All Batches" }, ...batches.filter((b) => b.classId === linkClassFilter).map((b) => ({ value: b.id, label: b.name }))]}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Student</label>
              <SearchableSelect
                value={selectedStudentToLink}
                onValueChange={setSelectedStudentToLink}
                placeholder="Search student…"
                options={students
                  .filter((s) => {
                    const notLinked = !(linkingParent?.linkedStudents ?? []).some((l) => l.studentId === s.id);
                    if (!linkClassFilter) return notLinked;
                    const classMatch = s.className?.includes(classes.find(c => c.id === linkClassFilter)?.name || "");
                    return notLinked && classMatch;
                  })
                  .map((s) => ({ value: s.id, label: `${s.name}${s.admissionNumber ? ` (${s.admissionNumber})` : ""}${s.className ? ` — ${s.className}` : ""}` }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLinkingParent(null); setSelectedStudentToLink(""); }}>Cancel</Button>
            <Button
              disabled={!selectedStudentToLink}
              onClick={() => linkingParent && handleLink(linkingParent.id, selectedStudentToLink)}
            >
              Link student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View All Students Modal */}
      <Dialog open={!!viewingStudents} onOpenChange={(open) => { if (!open) setViewingStudents(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Linked Students</DialogTitle>
            <DialogDescription>
              All students linked to <span className="font-medium text-foreground">{viewingStudents?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto py-2">
            {viewingStudents?.linkedStudents && viewingStudents.linkedStudents.length > 0 ? (
              <div className="space-y-2">
                {viewingStudents.linkedStudents.map((s) => (
                  <div key={s.studentId} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{s.studentName}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {s.admissionNumber && <span>Admission: {s.admissionNumber}</span>}
                        {s.className && <span>• Class: {s.className}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => viewingStudents && handleUnlink(viewingStudents.id, s.studentId)}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No linked students</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="rounded-[var(--radius)] shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg">Parents and linked students</CardTitle>
          <Button className="gap-2" onClick={() => setShowCreateForm(true)}>
            <UserPlus className="h-4 w-4" /> Create parent account
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={parents}
            columns={parentColumns}
            keyExtractor={(p) => p.id}
            loading={loading}
            emptyMessage="No parent accounts yet"
            emptyDescription="Create a parent account to get started"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminParentManagement;
