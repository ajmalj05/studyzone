import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { AcademicsCardIconLead } from "@/components/AcademicsCardIconLead";

interface ExamDto {
  id: string;
  name: string;
  className?: string;
}

interface MarksEntryDto {
  id: string;
  examId?: string;
  studentName: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  status?: string;
  rejectionReason?: string | null;
}

export default function AcademicsApprovals() {
  usePageHeaderConfigEffect(
    { title: "Approvals", description: "Review pending marks, approve or reject with reason." },
    [],
  );

  const [exams, setExams] = useState<ExamDto[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [marks, setMarks] = useState<MarksEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingAll, setApprovingAll] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectEntryId, setRejectEntryId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const loadExams = useCallback(async () => {
    try {
      const list = (await fetchApi("/Exams")) as ExamDto[];
      const safe = Array.isArray(list) ? list : [];
      setExams(safe);
      if (!selectedExamId && safe.length > 0) setSelectedExamId(safe[0].id);
    } catch {
      setExams([]);
    }
  }, [selectedExamId]);

  const loadMarks = useCallback(async () => {
    if (!selectedExamId) {
      setMarks([]);
      return;
    }
    try {
      const list = (await fetchApi(`/Exams/${selectedExamId}/marks`)) as MarksEntryDto[];
      setMarks(Array.isArray(list) ? list : []);
    } catch {
      setMarks([]);
    }
  }, [selectedExamId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadExams();
      setLoading(false);
    })();
  }, [loadExams]);

  useEffect(() => {
    loadMarks();
  }, [loadMarks]);

  const pendingRows = useMemo(
    () => marks.filter((m) => (m.status ?? "Pending") === "Pending"),
    [marks],
  );
  const approvedRows = useMemo(
    () => marks.filter((m) => (m.status ?? "") === "Approved"),
    [marks],
  );
  const rejectedRows = useMemo(
    () => marks.filter((m) => (m.status ?? "") === "Rejected"),
    [marks],
  );

  const handleApproveAll = async () => {
    if (!selectedExamId) return;
    setApprovingAll(true);
    try {
      const res = (await fetchApi(`/Exams/${selectedExamId}/marks/approve-all`, { method: "POST" })) as { approvedCount?: number };
      toast({ title: "Approved", description: `${res?.approvedCount ?? 0} pending row(s) approved.` });
      await loadMarks();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    } finally {
      setApprovingAll(false);
    }
  };

  const handleApproveRow = async (entryId: string) => {
    try {
      await fetchApi(`/Exams/marks/${entryId}/approve`, { method: "POST" });
      toast({ title: "Approved", description: "Marks entry approved." });
      await loadMarks();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  const handleRejectSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejectEntryId) return;
    try {
      await fetchApi(`/Exams/marks/${rejectEntryId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
      });
      toast({ title: "Rejected", description: "Entry sent back for correction." });
      setRejectOpen(false);
      await loadMarks();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Pending</p><p className="mt-1 text-2xl font-extrabold text-amber-600">{pendingRows.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Approved</p><p className="mt-1 text-2xl font-extrabold text-emerald-600">{approvedRows.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Rejected</p><p className="mt-1 text-2xl font-extrabold text-red-600">{rejectedRows.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.6px] text-slate-500">Total Rows</p><p className="mt-1 text-2xl font-extrabold text-teal-700">{marks.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
          <AcademicsCardIconLead
            icon={ShieldCheck}
            title="Marks Approvals"
            description="Review submitted marks and approve or reject rows."
          />
          <div className="flex items-center gap-2">
            <SearchableSelect
              value={selectedExamId}
              onValueChange={setSelectedExamId}
              placeholder="Select exam"
              className="min-w-[220px]"
              options={exams.map((e) => ({ value: e.id, label: `${e.name}${e.className ? ` (${e.className})` : ""}` }))}
            />
            <Button variant="secondary" className="rounded-lg gap-1.5" disabled={approvingAll || !selectedExamId || pendingRows.length === 0} onClick={handleApproveAll}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {approvingAll ? "Approving..." : "Approve All Pending"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="overflow-hidden rounded-[14px] border border-amber-200 bg-amber-50/40">
              <div className="flex items-center justify-between border-b border-amber-200 bg-amber-100/60 px-3 py-2 text-sm font-semibold text-amber-800">
                <span>Pending Review</span>
                <span>{pendingRows.length}</span>
              </div>
              <div className="space-y-2 p-3">
                {pendingRows.slice(0, 8).map((r) => (
                  <div key={r.id} className="rounded-lg border border-amber-200 bg-white p-2.5">
                    <p className="text-sm font-semibold text-slate-900">{r.studentName}</p>
                    <p className="text-xs text-slate-500">{r.subject} · {r.marksObtained}/{r.maxMarks}</p>
                    <div className="mt-2 flex gap-1.5">
                      <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => handleApproveRow(r.id)}>
                        <CheckCircle2 className="h-3 w-3" /> Approve
                      </Button>
                      <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs text-red-600" onClick={() => { setRejectEntryId(r.id); setRejectReason(""); setRejectOpen(true); }}>
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingRows.length === 0 && <p className="py-8 text-center text-sm text-slate-500">All clear</p>}
              </div>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-100/60 px-3 py-2 text-sm font-semibold text-emerald-800">
                <span>Approved & Published</span>
                <span>{approvedRows.length}</span>
              </div>
              <div className="space-y-2 p-3">
                {approvedRows.slice(0, 8).map((r) => (
                  <div key={r.id} className="rounded-lg border border-emerald-200 bg-white p-2.5">
                    <p className="text-sm font-semibold text-slate-900">{r.studentName}</p>
                    <p className="text-xs text-slate-500">{r.subject} · {r.marksObtained}/{r.maxMarks}</p>
                  </div>
                ))}
                {approvedRows.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nothing approved yet</p>}
              </div>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-rose-200 bg-rose-50/40">
              <div className="flex items-center justify-between border-b border-rose-200 bg-rose-100/60 px-3 py-2 text-sm font-semibold text-rose-800">
                <span>Rejected</span>
                <span>{rejectedRows.length}</span>
              </div>
              <div className="space-y-2 p-3">
                {rejectedRows.slice(0, 8).map((r) => (
                  <div key={r.id} className="rounded-lg border border-rose-200 bg-white p-2.5">
                    <p className="text-sm font-semibold text-slate-900">{r.studentName}</p>
                    <p className="text-xs text-slate-500">{r.subject} · {r.rejectionReason || "Rejected"}</p>
                  </div>
                ))}
                {rejectedRows.length === 0 && <p className="py-8 text-center text-sm text-slate-500">None rejected</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Marks Entry</DialogTitle>
            <DialogDescription>Optional note for correction.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRejectSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Reason</Label>
              <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Totals do not match register" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive">Reject entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

