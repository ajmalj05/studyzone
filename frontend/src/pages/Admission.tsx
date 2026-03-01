import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ClipboardList, UserPlus } from "lucide-react";

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
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<EnquiryDto[]>([]);
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
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
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<string>("");
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<string>("");
  const [applicationClassId, setApplicationClassId] = useState<string>("");
  const [applicationBatchId, setApplicationBatchId] = useState<string>("");

  const loadEnquiries = async () => {
    try {
      const url = enquiryStatusFilter
        ? `/Enquiries?status=${encodeURIComponent(enquiryStatusFilter)}&take=100`
        : "/Enquiries?take=100";
      const res = (await fetchApi(url)) as { items: EnquiryDto[]; total: number };
      setEnquiries(res.items ?? []);
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to load enquiries",
        variant: "destructive",
      });
    }
  };

  const loadApplications = async () => {
    try {
      const params = new URLSearchParams();
      params.set("take", "100");
      if (applicationStatusFilter) params.set("status", applicationStatusFilter);
      if (applicationClassId) params.set("classId", applicationClassId);
      if (applicationBatchId) params.set("batchId", applicationBatchId);
      const res = (await fetchApi(`/AdmissionApplications?${params.toString()}`)) as {
        items: ApplicationDto[];
        total: number;
      };
      setApplications(res.items ?? []);
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to load applications",
        variant: "destructive",
      });
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadEnquiries(), loadApplications(), loadClasses(), loadAllBatches()]);
      setLoading(false);
    })();
  }, [
    enquiryStatusFilter,
    applicationStatusFilter,
    applicationClassId,
    applicationBatchId,
  ]);

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.studentName.trim()) {
      toast({
        title: "Validation",
        description: "Student name is required.",
        variant: "destructive",
      });
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
          followUpDate: enquiryForm.followUpDate
            ? new Date(enquiryForm.followUpDate).toISOString()
            : undefined,
        }),
      });
      toast({ title: "Success", description: "Enquiry created." });
      setEnquiryForm({
        studentName: "",
        guardianName: "",
        phone: "",
        email: "",
        classOfInterest: "",
        source: "",
        notes: "",
        followUpDate: "",
      });
      setShowEnquiryForm(false);
      await loadEnquiries();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message || "Failed to create",
        variant: "destructive",
      });
    }
  };

  const openApplicationFromEnquiry = (e: EnquiryDto) => {
    navigate(`/admin/admission/application/new?enquiryId=${e.id}`);
  };

  const handleUpdateEnquiryStatus = async (id: string, status: string) => {
    try {
      const enq = enquiries.find((x) => x.id === id);
      if (!enq) return;
      await fetchApi(`/Enquiries/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...enq, status }),
      });
      toast({ title: "Success", description: "Enquiry updated." });
      await loadEnquiries();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message || "Failed to update",
        variant: "destructive",
      });
    }
  };

  const batchesForApplicationClass = applicationClassId
    ? batches.filter((b) => b.classId === applicationClassId)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardHeader title="Admission" />
      <div className="space-y-4">
        <Tabs defaultValue="enquiries" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="enquiries" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Enquiries
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Applications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enquiry pipeline</CardTitle>
                <CardDescription>
                  Track enquiries: New → Contacted → Interview Scheduled → Admitted / Not Admitted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={enquiryStatusFilter || "all"}
                    onValueChange={(v) => setEnquiryStatusFilter(v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {ENQUIRY_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
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
                        <div className="space-y-1">
                          <Label>Student name *</Label>
                          <Input
                            value={enquiryForm.studentName}
                            onChange={(e) =>
                              setEnquiryForm((f) => ({ ...f, studentName: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Guardian</Label>
                          <Input
                            value={enquiryForm.guardianName}
                            onChange={(e) =>
                              setEnquiryForm((f) => ({ ...f, guardianName: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Phone</Label>
                          <Input
                            value={enquiryForm.phone}
                            onChange={(e) =>
                              setEnquiryForm((f) => ({ ...f, phone: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={enquiryForm.email}
                            onChange={(e) =>
                              setEnquiryForm((f) => ({ ...f, email: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Class of interest</Label>
                          <Input
                            value={enquiryForm.classOfInterest}
                            onChange={(e) =>
                              setEnquiryForm((f) => ({ ...f, classOfInterest: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Source</Label>
                          <Select
                            value={enquiryForm.source || ""}
                            onValueChange={(v) =>
                              setEnquiryForm((f) => ({ ...f, source: v }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Walk-in">Walk-in</SelectItem>
                              <SelectItem value="Phone">Phone</SelectItem>
                              <SelectItem value="Online">Online</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label>Follow-up date</Label>
                          <Input
                            type="date"
                            value={enquiryForm.followUpDate}
                            onChange={(e) =>
                              setEnquiryForm((f) => ({ ...f, followUpDate: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label>Notes</Label>
                          <Input
                            value={enquiryForm.notes}
                            onChange={(e) =>
                              setEnquiryForm((f) => ({ ...f, notes: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEnquiryForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Create</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enquiries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.studentName}</TableCell>
                        <TableCell>{e.phone || e.email || "—"}</TableCell>
                        <TableCell>{e.classOfInterest ?? "—"}</TableCell>
                        <TableCell>{e.status}</TableCell>
                        <TableCell>
                          {e.followUpDate
                            ? new Date(e.followUpDate).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Select
                              value={e.status}
                              onValueChange={(v) => handleUpdateEnquiryStatus(e.id, v)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ENQUIRY_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {e.status === "Admitted" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => openApplicationFromEnquiry(e)}
                              >
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
                <CardDescription>
                  Create and manage admission applications. Click a row to open the full application form.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <Select
                    value={applicationStatusFilter || "all"}
                    onValueChange={(v) =>
                      setApplicationStatusFilter(v === "all" ? "" : v)
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {APPLICATION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={applicationClassId || "all"}
                    onValueChange={(v) => {
                      setApplicationClassId(v === "all" ? "" : v);
                      setApplicationBatchId("");
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All classes</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={applicationBatchId || "all"}
                    onValueChange={(v) => setApplicationBatchId(v === "all" ? "" : v)}
                    disabled={!applicationClassId}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All batches</SelectItem>
                      {batchesForApplicationClass.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                          {b.section ? ` (${b.section})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => navigate("/admin/admission/application/new")}>
                    Add application
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admission #</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((a) => (
                      <TableRow
                        key={a.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/admission/application/${a.id}`)}
                      >
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
        </Tabs>
      </div>
    </div>
  );
}
