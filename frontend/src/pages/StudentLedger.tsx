import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useAcademicYear } from "@/context/AcademicYearContext";
import { CurrentAcademicYearBadge } from "@/components/CurrentAcademicYearBadge";
import { FeeLedgerDto, StudentDto, ClassDto, BatchDto, FEE_MONTH_NAMES, formatCurrency } from "@/types/fees";

export default function StudentLedger() {
  const { selectedYearId } = useAcademicYear();
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [ledger, setLedger] = useState<FeeLedgerDto | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [generateChargesLoading, setGenerateChargesLoading] = useState(false);
  const [classFilter, setClassFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedYearId) params.set("academicYearId", selectedYearId);
      params.set("take", "500");
      const res = (await fetchApi(`/Students?${params.toString()}`)) as { items: StudentDto[] };
      setStudents(res.items ?? []);
    } catch (_) {}
  };

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch (_) {}
  };

  const loadBatches = async () => {
    try {
      const url = selectedYearId ? `/Batches?academicYearId=${encodeURIComponent(selectedYearId)}` : "/Batches";
      const list = (await fetchApi(url)) as BatchDto[];
      setBatches(list);
    } catch (_) {
      setBatches([]);
    }
  };

  const loadLedger = async (studentId: string) => {
    if (!studentId) return;
    try {
      const data = (await fetchApi(`/Fees/ledger/${studentId}`)) as FeeLedgerDto;
      setLedger(data);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load ledger", variant: "destructive" });
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadStudents(), loadClasses(), loadBatches()]);
      setLoading(false);
    })();
  }, [selectedYearId]);

  useEffect(() => {
    loadBatches();
  }, [selectedYearId]);

  useEffect(() => {
    if (selectedStudentId) loadLedger(selectedStudentId);
    else setLedger(null);
  }, [selectedStudentId]);

  const batchesForClass = classFilter ? batches.filter((b) => b.classId === classFilter) : batches;

  const filteredStudents = students.filter((s) => {
    if (classFilter && s.classId !== classFilter) return false;
    if (batchFilter && s.batchId !== batchFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const name = s.name?.toLowerCase() ?? "";
      const admission = (s.admissionNumber ?? "").toLowerCase();
      if (!name.includes(term) && !admission.includes(term)) return false;
    }
    return true;
  });

  useEffect(() => {
    if (!selectedStudentId) return;
    const stillVisible = filteredStudents.some((s) => s.id === selectedStudentId);
    if (!stillVisible) {
      setSelectedStudentId("");
      setLedger(null);
    }
  }, [classFilter, batchFilter, searchTerm, filteredStudents, selectedStudentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DashboardHeader title="Student Ledger" />
        <CurrentAcademicYearBadge />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student fee ledger</CardTitle>
          <CardDescription>View charges, payments and balance for a student.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <div>
              <Label>Class</Label>
              <Select
                value={classFilter || "all"}
                onValueChange={(v) => {
                  const next = v === "all" ? "" : v;
                  setClassFilter(next);
                  setBatchFilter("");
                }}
              >
                <SelectTrigger className="w-[160px] mt-1">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Batch</Label>
              <Select
                value={batchFilter || "all"}
                onValueChange={(v) => setBatchFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[160px] mt-1">
                  <SelectValue placeholder="All batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All batches</SelectItem>
                  {batchesForClass.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <input
                className="mt-1 w-[220px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Name or admission #"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedStudentId && (
              <Button
                type="button"
                variant="outline"
                disabled={generateChargesLoading}
                onClick={async () => {
                  setGenerateChargesLoading(true);
                  try {
                    const result = (await fetchApi("/Fees/generate-charges", {
                      method: "POST",
                      body: JSON.stringify({
                        studentId: selectedStudentId,
                        academicYearId: selectedYearId || undefined,
                      }),
                    })) as { chargesAdded: number };
                    toast({ title: "Charges generated", description: result.chargesAdded === 0 ? "No new charges added (all periods already have charges)." : `${result.chargesAdded} charge(s) added.` });
                    await loadLedger(selectedStudentId);
                  } catch (e: unknown) {
                    toast({ title: "Error", description: (e as Error).message || "Failed to generate charges", variant: "destructive" });
                  }
                  setGenerateChargesLoading(false);
                }}
              >
                {generateChargesLoading ? "Generating…" : "Generate outstanding"}
              </Button>
            )}
          </div>
          <div className="mt-2">
            <Label className="mb-1 block">Students</Label>
            <div className="max-h-64 overflow-y-auto rounded-md border border-input bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Admission #</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Batch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s) => (
                    <TableRow
                      key={s.id}
                      className={`cursor-pointer hover:bg-muted ${selectedStudentId === s.id ? "bg-muted/70" : ""}`}
                      onClick={() => setSelectedStudentId(s.id)}
                    >
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.admissionNumber}</TableCell>
                      <TableCell>{classes.find((c) => c.id === s.classId)?.name ?? "-"}</TableCell>
                      <TableCell>{batches.find((b) => b.id === s.batchId)?.name ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                  {filteredStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        No students found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {ledger && (
            <div className="space-y-4">
              <p><strong>Total charges:</strong> {formatCurrency(ledger.totalCharges)} | <strong>Total payments:</strong> {formatCurrency(ledger.totalPayments)} | <strong>Balance:</strong> {formatCurrency(ledger.balance)}{ledger.feePaymentStartMonth != null && ledger.feePaymentStartMonth >= 1 && ledger.feePaymentStartMonth <= 12 ? <> | <strong>Fees start from:</strong> {ledger.feePaymentStartYear != null ? `${FEE_MONTH_NAMES[ledger.feePaymentStartMonth - 1]} ${ledger.feePaymentStartYear}` : FEE_MONTH_NAMES[ledger.feePaymentStartMonth - 1]}</> : ""}</p>
              <Table>
                <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Charge</TableHead></TableRow></TableHeader>
                <TableBody>{ledger.charges.map((c) => (<TableRow key={c.id}><TableCell>{c.period}</TableCell><TableCell>{formatCurrency(c.amount)}</TableCell></TableRow>))}</TableBody>
              </Table>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Receipt</TableHead><TableHead>Mode</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                <TableBody>{ledger.payments.map((p) => (<TableRow key={p.id}><TableCell>{new Date(p.paidAt).toLocaleDateString()}</TableCell><TableCell>{p.receiptNumber}</TableCell><TableCell>{p.mode}</TableCell><TableCell>{formatCurrency(p.amount)}</TableCell></TableRow>))}</TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
