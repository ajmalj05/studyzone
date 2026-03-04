import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Link2, Unlink } from "lucide-react";

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
  const [linkingParentId, setLinkingParentId] = useState<string | null>(null);
  const [selectedStudentToLink, setSelectedStudentToLink] = useState("");

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadParents(), loadStudents()]);
      setLoading(false);
    })();
  }, []);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

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
      setLinkingParentId(null);
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
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message ?? "Failed to unlink", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <DashboardHeader title="Parent Management" />
        <Button
          className="gap-2"
          onClick={() => setShowCreateForm(true)}
        >
          <UserPlus className="h-4 w-4" /> Create parent account
        </Button>
      </div>

      <Dialog open={showCreateForm} onOpenChange={(open) => { setShowCreateForm(open); if (!open) setSelectedStudentIds([]); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New parent account</DialogTitle>
            <DialogDescription>You must select at least one student to link. Parents cannot be created without a linked student.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateParent} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
              <div className="space-y-1">
                <label className="text-sm font-medium">Full name</label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Parent name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Link to student(s) * (select at least one)</label>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students in the system. Add students first.</p>
              ) : (
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-muted/30">
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={selectedStudentIds.includes(s.id)}
                        onCheckedChange={() => toggleStudentSelection(s.id)}
                      />
                      <span>{s.name} {s.admissionNumber ? `(${s.admissionNumber})` : ""} {s.className ? `— ${s.className}` : ""}</span>
                    </label>
                  ))}
                </div>
              )}
              {selectedStudentIds.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedStudentIds.length} student(s) selected</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); setSelectedStudentIds([]); }}>Cancel</Button>
              <Button type="submit" disabled={students.length === 0 || selectedStudentIds.length === 0}>Create parent & link students</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="rounded-[var(--radius)] shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Parents and linked students</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-4">Loading...</p>
          ) : parents.length === 0 ? (
            <p className="text-muted-foreground py-4">No parent accounts yet. Create one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent (Login ID)</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked students</TableHead>
                  <TableHead className="w-[200px]">Link student</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parents.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.userId}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell>
                      <ul className="space-y-1">
                        {(p.linkedStudents ?? []).map((s) => (
                          <li key={s.studentId} className="flex items-center gap-2 text-sm">
                            <span>{s.studentName} {s.className ? `(${s.className})` : ""}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleUnlink(p.id, s.studentId)}
                            >
                              <Unlink className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))}
                        {(!p.linkedStudents || p.linkedStudents.length === 0) && (
                          <li className="text-muted-foreground text-sm">None</li>
                        )}
                      </ul>
                    </TableCell>
                    <TableCell>
                      {linkingParentId === p.id ? (
                        <div className="flex gap-2 items-center">
                          <Select value={selectedStudentToLink} onValueChange={setSelectedStudentToLink}>
                            <SelectTrigger className="rounded-xl flex-1 min-w-0">
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                            <SelectContent>
                              {students
                                .filter((s) => !(p.linkedStudents ?? []).some((l) => l.studentId === s.id))
                                .map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name} {s.admissionNumber ?? ""} {s.className ? `(${s.className})` : ""}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="rounded-xl"
                            onClick={() => handleLink(p.id, selectedStudentToLink)}
                            disabled={!selectedStudentToLink}
                          >
                            Link
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setLinkingParentId(null); setSelectedStudentToLink(""); }}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl gap-1"
                          onClick={() => setLinkingParentId(p.id)}
                        >
                          <Link2 className="h-4 w-4" /> Link student
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminParentManagement;
