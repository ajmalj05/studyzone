import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { ClipboardList, UserPlus, FileCheck, Upload } from "lucide-react";

interface EnquiryDto {
  id: string;
  studentName: string;
  guardianName?: string;
  phone?: string;
  email?: string;
  classOfInterest?: string;
  source?: string;
  status: string;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
}

interface ApplicationDto {
  id: string;
  studentName: string;
  classApplied?: string;
  classId?: string;
  batchId?: string;
  status: string;
  admissionNumber?: string;
  batch?: string;
  section?: string;
  createdAt: string;
}

interface ClassDto {
  id: string;
  name: string;
  code: string;
  seatLimit: number;
}

interface BatchDto {
  id: string;
  classId: string;
  className: string;
  name: string;
  section?: string;
}

const ENQUIRY_STATUSES = ["New", "Contacted", "InterviewScheduled", "Admitted", "NotAdmitted"];
const APPLICATION_STATUSES = ["Draft", "Submitted", "PendingApproval", "Approved", "Rejected"];

export default function Admission() {
  const [enquiries, setEnquiries] = useState<EnquiryDto[]>([]);
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [pendingApps, setPendingApps] = useState<ApplicationDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [batchesForClass, setBatchesForClass] = useState<BatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [enquiryForm, setEnquiryForm] = useState({
    studentName: "",
    guardianName: "",
    phone: "",
    email: "",
    classOfInterest: "",
    source: "",
    notes: "",
    followUpDate: "",
  });
  const [appForm, setAppForm] = useState({
    studentName: "",
    dateOfBirth: "",
    previousSchool: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    classApplied: "",
    classId: "",
    batchId: "",
    subjectsRequired: "",
  });
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [showAppForm, setShowAppForm] = useState(false);
  const [appFormEnquiryId, setAppFormEnquiryId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [approvalReason, setApprovalReason] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalClassBatch, setApprovalClassBatch] = useState<Record<string, { classId: string; batchId: string }>>({});

  const loadEnquiries = async () => {
    try {
      const url = statusFilter ? `/Enquiries?status=${encodeURIComponent(statusFilter)}&take=100` : "/Enquiries?take=100";
      const res = await fetchApi(url) as { items: EnquiryDto[]; total: number };
      setEnquiries(res.items ?? []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load enquiries", variant: "destructive" });
    }
  };

  const loadApplications = async () => {
    try {
      const url = statusFilter ? `/AdmissionApplications?status=${encodeURIComponent(statusFilter)}&take=100` : "/AdmissionApplications?take=100";
      const res = await fetchApi(url) as { items: ApplicationDto[]; total: number };
      setApplications(res.items ?? []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load applications", variant: "destructive" });
    }
  };

  const loadPending = async () => {
    try {
      const res = await fetchApi("/AdmissionApplications/pending?take=50") as { items: ApplicationDto[]; total: number };
      setPendingApps(res.items ?? []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load pending", variant: "destructive" });
    }
  };

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch {
      setClasses([]);
    }
  };

  const loadAllBatches = async () => {
    try {
      const list = (await fetchApi("/Batches")) as BatchDto[];
      setBatches(list);
    } catch {
      setBatches([]);
    }
  };

  const loadBatchesForClass = async (classId: string) => {
    if (!classId) { setBatchesForClass([]); return; }
    try {
      const list = (await fetchApi(`/Batches/by-class/${classId}`)) as BatchDto[];
      setBatchesForClass(list);
    } catch {
      setBatchesForClass([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadEnquiries(), loadApplications(), loadPending(), loadClasses(), loadAllBatches()]);
      setLoading(false);
    })();
  }, [statusFilter]);

  useEffect(() => {
    if (appForm.classId) loadBatchesForClass(appForm.classId);
    else setBatchesForClass([]);
  }, [appForm.classId]);

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.studentName.trim()) {
      toast({ title: "Validation", description: "Student name is required.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/Enquiries", {
        method: "POST",
        body: JSON.stringify({
          studentName: enquiryForm.studentName,
          guardianName: enquiryForm.guardianName || undefined,
          phone: enquiryForm.phone || undefined,
          email: enquiryForm.email || undefined,
          classOfInterest: enquiryForm.classOfInterest || undefined,
          source: enquiryForm.source || undefined,
          notes: enquiryForm.notes || undefined,
          followUpDate: enquiryForm.followUpDate ? new Date(enquiryForm.followUpDate).toISOString() : undefined,
        }),
      });
      toast({ title: "Success", description: "Enquiry created." });
      setEnquiryForm({ studentName: "", guardianName: "", phone: "", email: "", classOfInterest: "", source: "", notes: "", followUpDate: "" });
      setShowEnquiryForm(false);
      await loadEnquiries();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to create", variant: "destructive" });
    }
  };

  const openCreateAdmissionFromEnquiry = (e: EnquiryDto) => {
    setAppForm({
      studentName: e.studentName,
      dateOfBirth: "",
      previousSchool: "",
      guardianName: e.guardianName ?? "",
      guardianPhone: e.phone ?? "",
      guardianEmail: e.email ?? "",
      classApplied: e.classOfInterest ?? "",
      classId: "",
      batchId: "",
      subjectsRequired: "",
    });
    setAppFormEnquiryId(e.id);
    setShowAppForm(true);
  };

  const handleUpdateEnquiryStatus = async (id: string, status: string) => {
    try {
      const enq = enquiries.find((e) => e.id === id);
      if (!enq) return;
      await fetchApi(`/Enquiries/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...enq,
          status,
        }),
      });
      toast({ title: "Success", description: "Enquiry updated." });
      await loadEnquiries();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to update", variant: "destructive" });
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.studentName.trim()) {
      toast({ title: "Validation", description: "Student name is required.", variant: "destructive" });
      return;
    }
    try {
      await fetchApi("/AdmissionApplications", {
        method: "POST",
        body: JSON.stringify({
          enquiryId: appFormEnquiryId || undefined,
          studentName: appForm.studentName,
          dateOfBirth: appForm.dateOfBirth ? new Date(appForm.dateOfBirth).toISOString() : undefined,
          previousSchool: appForm.previousSchool || undefined,
          guardianName: appForm.guardianName || undefined,
          guardianPhone: appForm.guardianPhone || undefined,
          guardianEmail: appForm.guardianEmail || undefined,
          classApplied: appForm.classApplied || undefined,
          classId: appForm.classId || undefined,
          batchId: appForm.batchId || undefined,
          subjectsRequired: appForm.subjectsRequired || undefined,
        }),
      });
      toast({ title: "Success", description: "Application created." });
      setAppForm({ studentName: "", dateOfBirth: "", previousSchool: "", guardianName: "", guardianPhone: "", guardianEmail: "", classApplied: "", classId: "", batchId: "", subjectsRequired: "" });
      setAppFormEnquiryId(null);
      setShowAppForm(false);
      await loadApplications();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to create", variant: "destructive" });
    }
  };

  const handleSubmitForApproval = async (id: string, batch: string, section: string) => {
    try {
      await fetchApi(`/AdmissionApplications/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ batch: batch || undefined, section: section || undefined }),
      });
      toast({ title: "Success", description: "Submitted for approval." });
      await loadApplications();
      await loadPending();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to submit", variant: "destructive" });
    }
  };

  const handleApproveReject = async (id: string, status: "Approved" | "Rejected", app?: ApplicationDto) => {
    setApprovingId(id);
    const sel = approvalClassBatch[id];
    const classId = sel?.classId || app?.classId;
    const batchId = sel?.batchId || app?.batchId;
    try {
      await fetchApi(`/AdmissionApplications/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({
          status,
          reason: approvalReason,
          classId: classId || undefined,
          batchId: batchId || undefined,
        }),
      });
      toast({ title: "Success", description: `Application ${status.toLowerCase()}.` });
      setApprovalReason("");
      setApprovingId(null);
      setApprovalClassBatch((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await loadApplications();
      await loadPending();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
        <DashboardHeader title="Admission" />
        <div className="space-y-4">
          <Tabs defaultValue="enquiries" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="enquiries" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Enquiries
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Applications
              </TabsTrigger>
              <TabsTrigger value="approvals" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" /> Approval Queue
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enquiries" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Enquiry pipeline</CardTitle>
                  <CardDescription>Track enquiries: New → Contacted → Interview Scheduled → Admitted / Not Admitted</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {ENQUIRY_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setShowEnquiryForm(true)}>Add enquiry</Button>
                  </div>
                  <Dialog open={showEnquiryForm} onOpenChange={setShowEnquiryForm}>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add enquiry</DialogTitle>
                        <DialogDescription>Student and guardian contact details.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateEnquiry} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>Student name *</Label><Input value={enquiryForm.studentName} onChange={(e) => setEnquiryForm((f) => ({ ...f, studentName: e.target.value }))} required /></div>
                          <div className="space-y-1"><Label>Guardian</Label><Input value={enquiryForm.guardianName} onChange={(e) => setEnquiryForm((f) => ({ ...f, guardianName: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Phone</Label><Input value={enquiryForm.phone} onChange={(e) => setEnquiryForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Email</Label><Input type="email" value={enquiryForm.email} onChange={(e) => setEnquiryForm((f) => ({ ...f, email: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Class of interest</Label><Input value={enquiryForm.classOfInterest} onChange={(e) => setEnquiryForm((f) => ({ ...f, classOfInterest: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Source</Label><Select value={enquiryForm.source || ""} onValueChange={(v) => setEnquiryForm((f) => ({ ...f, source: v }))}><SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger><SelectContent><SelectItem value="Walk-in">Walk-in</SelectItem><SelectItem value="Phone">Phone</SelectItem><SelectItem value="Online">Online</SelectItem></SelectContent></Select></div>
                          <div className="space-y-1 col-span-2"><Label>Follow-up date</Label><Input type="date" value={enquiryForm.followUpDate} onChange={(e) => setEnquiryForm((f) => ({ ...f, followUpDate: e.target.value }))} /></div>
                          <div className="space-y-1 col-span-2"><Label>Notes</Label><Input value={enquiryForm.notes} onChange={(e) => setEnquiryForm((f) => ({ ...f, notes: e.target.value }))} /></div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setShowEnquiryForm(false)}>Cancel</Button>
                          <Button type="submit">Create</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Contact</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead><TableHead>Follow-up</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {enquiries.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.studentName}</TableCell>
                          <TableCell>{e.phone || e.email || "—"}</TableCell>
                          <TableCell>{e.classOfInterest ?? "—"}</TableCell>
                          <TableCell>{e.status}</TableCell>
                          <TableCell>{e.followUpDate ? new Date(e.followUpDate).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Select value={e.status} onValueChange={(v) => handleUpdateEnquiryStatus(e.id, v)}>
                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{ENQUIRY_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                              </Select>
                              {e.status === "Admitted" && (
                                <Button type="button" size="sm" variant="secondary" onClick={() => openCreateAdmissionFromEnquiry(e)}>
                                  Create admission
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Applications</CardTitle>
                  <CardDescription>Create and manage admission applications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All</SelectItem>{APPLICATION_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                    </Select>
                    <Button onClick={() => setShowAppForm(true)}>Add application</Button>
                  </div>
                  <Dialog open={showAppForm} onOpenChange={(open) => { setShowAppForm(open); if (!open) setAppFormEnquiryId(null); }}>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add application</DialogTitle>
                        <DialogDescription>Admission application details.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateApplication} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label>Student name *</Label><Input value={appForm.studentName} onChange={(e) => setAppForm((f) => ({ ...f, studentName: e.target.value }))} required /></div>
                          <div className="space-y-1"><Label>DOB</Label><Input type="date" value={appForm.dateOfBirth} onChange={(e) => setAppForm((f) => ({ ...f, dateOfBirth: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Class</Label><Select value={appForm.classId} onValueChange={(v) => setAppForm((f) => ({ ...f, classId: v, batchId: "" }))}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>))}</SelectContent></Select></div>
                          <div className="space-y-1"><Label>Batch</Label><Select value={appForm.batchId} onValueChange={(v) => setAppForm((f) => ({ ...f, batchId: v }))} disabled={!appForm.classId}><SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger><SelectContent>{batchesForClass.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}{b.section ? ` (${b.section})` : ""}</SelectItem>))}</SelectContent></Select></div>
                          <div className="space-y-1 col-span-2"><Label>Class applied (free text, optional)</Label><Input value={appForm.classApplied} onChange={(e) => setAppForm((f) => ({ ...f, classApplied: e.target.value }))} placeholder="e.g. G8" /></div>
                          <div className="space-y-1"><Label>Previous school</Label><Input value={appForm.previousSchool} onChange={(e) => setAppForm((f) => ({ ...f, previousSchool: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Guardian name</Label><Input value={appForm.guardianName} onChange={(e) => setAppForm((f) => ({ ...f, guardianName: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Guardian phone</Label><Input value={appForm.guardianPhone} onChange={(e) => setAppForm((f) => ({ ...f, guardianPhone: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Guardian email</Label><Input type="email" value={appForm.guardianEmail} onChange={(e) => setAppForm((f) => ({ ...f, guardianEmail: e.target.value }))} /></div>
                          <div className="space-y-1 col-span-2"><Label>Subjects required</Label><Input value={appForm.subjectsRequired} onChange={(e) => setAppForm((f) => ({ ...f, subjectsRequired: e.target.value }))} placeholder="Comma separated" /></div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => { setShowAppForm(false); setAppFormEnquiryId(null); }}>Cancel</Button>
                          <Button type="submit">Create</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead><TableHead>Admission #</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {applications.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.studentName}</TableCell>
                          <TableCell>{a.classApplied ?? "—"}</TableCell>
                          <TableCell>{a.status}</TableCell>
                          <TableCell>{a.admissionNumber ?? "—"}</TableCell>
                          <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approvals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Approval queue</CardTitle>
                  <CardDescription>Approve or reject applications. Set Class/Batch if not already set; on approval, admission number is generated.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <Label>Reason (optional)</Label>
                    <Input value={approvalReason} onChange={(e) => setApprovalReason(e.target.value)} placeholder="Reason for approval/rejection" />
                  </div>
                  <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class applied</TableHead><TableHead>Class (select)</TableHead><TableHead>Batch (select)</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {pendingApps.map((a) => {
                        const sel = approvalClassBatch[a.id] ?? { classId: a.classId ?? "", batchId: a.batchId ?? "" };
                        return (
                          <TableRow key={a.id}>
                            <TableCell>{a.studentName}</TableCell>
                            <TableCell>{a.classApplied ?? "—"}</TableCell>
                            <TableCell>
                              <Select value={sel.classId || "none"} onValueChange={(v) => setApprovalClassBatch((prev) => ({ ...prev, [a.id]: { ...prev[a.id], classId: v === "none" ? "" : v, batchId: "" } }))}>
                                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Class" /></SelectTrigger>
                                <SelectContent><SelectItem value="none">—</SelectItem>{classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select value={sel.batchId || "none"} onValueChange={(v) => setApprovalClassBatch((prev) => ({ ...prev, [a.id]: { ...prev[a.id], batchId: v === "none" ? "" : v } }))} disabled={!sel.classId}>
                                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Batch" /></SelectTrigger>
                                <SelectContent><SelectItem value="none">—</SelectItem>{(sel.classId ? batches.filter((b) => b.classId === sel.classId) : []).map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleApproveReject(a.id, "Approved", a)} disabled={approvingId === a.id}>Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleApproveReject(a.id, "Rejected", a)} disabled={approvingId === a.id}>Reject</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {pendingApps.length === 0 && <p className="text-muted-foreground text-sm py-4">No pending approvals.</p>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}
