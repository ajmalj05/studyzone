import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";
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
import { ClipboardList, Plus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

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

const ENQUIRY_STATUSES = ["New", "Contacted", "InterviewScheduled", "Admitted", "NotAdmitted"];

interface ClassDto {
  id: string;
  name: string;
  code: string;
}

export default function Enquiry() {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<EnquiryDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
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
  const [enquiryClassFilter, setEnquiryClassFilter] = useState<string>("");
  const initialLoadDone = useRef(false);

  usePageHeaderConfigEffect({ title: "Enquiry", description: "Track leads and follow-ups before admission." }, []);

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch {
      setClasses([]);
    }
  };

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

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    (async () => {
      if (!initialLoadDone.current) setLoading(true);
      await loadEnquiries();
      setLoading(false);
      initialLoadDone.current = true;
    })();
  }, [enquiryStatusFilter]);

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

  const selectedClass = enquiryClassFilter ? classes.find((c) => c.id === enquiryClassFilter) : null;
  const displayedEnquiries = selectedClass
    ? enquiries.filter((e) => {
        const interest = (e.classOfInterest ?? "").trim().toLowerCase();
        const nameMatch = selectedClass.name.trim().toLowerCase();
        const codeMatch = selectedClass.code.trim().toLowerCase();
        return interest === nameMatch || interest === codeMatch;
      })
    : enquiries;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                 Enquiry pipeline
              </CardTitle>
            </div>
            <div className="flex flex-wrap gap-2 items-center shrink-0">
              <SearchableSelect
                value={enquiryClassFilter || "all"}
                onValueChange={(v) => setEnquiryClassFilter(v === "all" ? "" : v)}
                placeholder="Class"
                className="w-[150px]"
                options={[
                  { value: "all", label: "All classes" },
                  ...classes.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
                ]}
              />
              <SearchableSelect
                value={enquiryStatusFilter || "all"}
                onValueChange={(v) => setEnquiryStatusFilter(v === "all" ? "" : v)}
                placeholder="Status"
                className="w-[150px]"
                options={[
                  { value: "all", label: "All statuses" },
                  ...ENQUIRY_STATUSES.map((s) => ({ value: s, label: s })),
                ]}
              />
              <Button className="gap-1.5" onClick={() => setShowEnquiryForm(true)}>
                <Plus className="h-4 w-4" /> Add enquiry
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={showEnquiryForm} onOpenChange={setShowEnquiryForm}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add enquiry</DialogTitle>
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
                      <SearchableSelect
                        value={enquiryForm.source || ""}
                        onValueChange={(v) =>
                          setEnquiryForm((f) => ({ ...f, source: v }))
                        }
                        placeholder="Source"
                        options={[
                          { value: "Walk-in", label: "Walk-in" },
                          { value: "Phone", label: "Phone" },
                          { value: "Online", label: "Online" },
                        ]}
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <Label>Follow-up date</Label>
                      <DatePicker value={enquiryForm.followUpDate} onChange={(v) => setEnquiryForm((f) => ({ ...f, followUpDate: v }))} />
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

            <DataTable
              data={displayedEnquiries}
              columns={[
                {
                  key: "student",
                  header: "Student",
                  cell: (e) => (
                    <span className="font-semibold capitalize text-slate-700 dark:text-slate-200">
                      {e.studentName}
                      {e.classOfInterest && <span className="ml-2 text-xs font-normal text-slate-500">({e.classOfInterest})</span>}
                    </span>
                  ),
                },
                {
                  key: "contact",
                  header: "Contact",
                  cell: (e) => <span className="text-slate-600 dark:text-slate-400">{e.phone || e.email || "—"}</span>,
                },
                {
                  key: "status",
                  header: "Status",
                  badge: (e) => ({
                    label: e.status,
                    variant:
                      e.status === "New" ? "info" :
                      e.status === "Contacted" ? "amber" :
                      e.status === "InterviewScheduled" ? "violet" :
                      e.status === "Admitted" ? "success" : "destructive",
                  }),
                },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  cell: (e) => (
                    <div className="flex items-center justify-end gap-2">
                      <SearchableSelect
                        value={e.status}
                        onValueChange={(v) => handleUpdateEnquiryStatus(e.id, v)}
                        className="w-[150px]"
                        options={ENQUIRY_STATUSES.map((s) => ({ value: s, label: s }))}
                      />
                      {e.status === "Admitted" && (
                        <Button type="button" size="sm" variant="secondary" className="h-7 text-xs" onClick={() => openApplicationFromEnquiry(e)}>
                          Create admission
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              keyExtractor={(e) => e.id}
              emptyMessage="No enquiries found"
              emptyDescription="Add an enquiry to start tracking leads"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
