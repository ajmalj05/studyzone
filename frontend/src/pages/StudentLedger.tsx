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
import { FeeLedgerDto, StudentDto, ClassDto, BatchDto, FEE_MONTH_NAMES, formatCurrency, FeeReceiptDto } from "@/types/fees";

interface SchoolProfileDto {
  id: string;
  name: string;
  address?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
}

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function buildReceiptHtml(receipt: FeeReceiptDto, school: SchoolProfileDto | null): string {
  const schoolName = school?.name || "Studyzone Private Institute";
  const logoUrl =
    school?.logoUrl || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");
  const guardianName = receipt.guardianName || "—";
  const className = receipt.className || "—";
  const feeTerm = receipt.feeTerm || "—";
  const paidDate = new Date(receipt.paidAt).toLocaleDateString();

  const printCss = `
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11pt; }
    .receipt-document { max-width: 210mm; margin: 0 auto; padding: 10mm 8mm; }
    .receipt-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
    .receipt-header-left { display: flex; align-items: center; gap: 10px; }
    .receipt-logo-wrap { flex-shrink: 0; }
    .receipt-logo { height: 52px; width: 52px; object-fit: contain; display: block; }
    .receipt-school-name { margin: 0; font-size: 1.25rem; font-weight: 700; }
    .receipt-tagline { margin: 0; font-size: 0.8rem; color: #555; }
    .receipt-contact { margin: 2px 0 0; font-size: 0.75rem; color: #555; }
    .receipt-title { margin: 4px 0 0; font-size: 1rem; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; }
    .receipt-grid { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.85rem; }
    .receipt-grid td { padding: 3px 6px; vertical-align: top; }
    .receipt-grid .label { font-weight: 600; width: 30%; }
    .receipt-grid .value { width: 20%; }
    .receipt-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85rem; }
    .receipt-table th, .receipt-table td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
    .receipt-table th { background: #f3f4f6; font-weight: 600; }
    .text-right { text-align: right; }
    .receipt-footer { margin-top: 18px; font-size: 0.8rem; }
    .receipt-footer-row { display: flex; justify-content: space-between; margin-top: 16px; }
    .receipt-footer-cell { width: 32%; text-align: center; }
    .muted { color: #666; }
    .section-title { font-size: 0.9rem; font-weight: 600; margin-top: 12px; margin-bottom: 4px; }
    .fee-statement-title { font-weight: 600; margin-top: 14px; margin-bottom: 6px; }
    .page-break { page-break-after: always; }
  `;

  const particularsRows =
    receipt.particulars.length > 0
      ? receipt.particulars
          .map(
            (p, index) =>
              `<tr><td>${index + 1}</td><td>${esc(p.name)}</td><td class="text-right">${receipt.currencySymbol ?? "₹"}${p.amount.toLocaleString(
                "en-IN"
              )}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="3" class="muted">No fee particulars</td></tr>`;

  const historyRows =
    receipt.history.length > 0
      ? receipt.history
          .map(
            (h, index) =>
              `<tr>
                <td>${index + 1}</td>
                <td>${new Date(h.submissionDate).toLocaleDateString()}</td>
                <td>${esc(h.feeTerm ?? "—")}</td>
                <td class="text-right">${receipt.currencySymbol ?? "₹"}${h.totalAmount.toLocaleString("en-IN")}</td>
                <td class="text-right">${receipt.currencySymbol ?? "₹"}${h.deposit.toLocaleString("en-IN")}</td>
                <td class="text-right">${receipt.currencySymbol ?? "₹"}${h.due.toLocaleString("en-IN")}</td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="6" class="muted">No payment history available</td></tr>`;

  const currency = receipt.currencySymbol ?? "₹";

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Fees Paid Receipt</title>
    <style>${printCss}</style>
  </head>
  <body>
    <div class="receipt-document">
      <div class="receipt-header">
        <div class="receipt-header-left">
          <div class="receipt-logo-wrap">
            <img src="${esc(logoUrl)}" alt="School" class="receipt-logo" />
          </div>
          <div>
            <h1 class="receipt-school-name">${esc(schoolName)}</h1>
            <p class="receipt-tagline">Fees Paid Receipt</p>
            <p class="receipt-contact">
              ${esc(school?.address || "")}${school?.phone ? " | " + esc(school.phone) : ""}${
    school?.email ? " | " + esc(school.email) : ""
  }
            </p>
          </div>
        </div>
      </div>

      <table class="receipt-grid">
        <tr>
          <td class="label">Registration No</td><td class="value">${esc(receipt.admissionNumber || "—")}</td>
          <td class="label">Serial No</td><td class="value">${esc(receipt.receiptNumber)}</td>
        </tr>
        <tr>
          <td class="label">Student Name</td><td class="value">${esc(receipt.studentName)}</td>
          <td class="label">Date of Submission</td><td class="value">${esc(paidDate)}</td>
        </tr>
        <tr>
          <td class="label">Guardian Name</td><td class="value">${esc(guardianName)}</td>
          <td class="label">Fees Term</td><td class="value">${esc(feeTerm)}</td>
        </tr>
        <tr>
          <td class="label">Class</td><td class="value">${esc(className)}</td>
          <td class="label">Total Amount</td><td class="value text-right">${currency}${receipt.totalCharges.toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td class="label"></td><td class="value"></td>
          <td class="label">Deposit Amount</td><td class="value text-right">${currency}${receipt.deposit.toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td class="label"></td><td class="value"></td>
          <td class="label">Remaining Balance</td><td class="value text-right">${currency}${receipt.remainingBalance.toLocaleString("en-IN")}</td>
        </tr>
      </table>

      <div class="section-title">Fee particulars</div>
      <table class="receipt-table">
        <thead>
          <tr><th>Sr. No.</th><th>Particulars</th><th class="text-right">Amount</th></tr>
        </thead>
        <tbody>
          ${particularsRows}
        </tbody>
      </table>

      <div class="section-title">Totals</div>
      <table class="receipt-table">
        <tbody>
          <tr>
            <td class="label">TOTAL</td>
            <td class="text-right">${currency}${receipt.totalCharges.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td class="label">DEPOSIT</td>
            <td class="text-right">${currency}${receipt.deposit.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td class="label">DUE-ABLE BALANCE</td>
            <td class="text-right">${currency}${receipt.remainingBalance.toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>

      <div class="fee-statement-title">Fee Submission Statement Of ${esc(receipt.studentName)}</div>
      <table class="receipt-table">
        <thead>
          <tr>
            <th>Sr#</th>
            <th>Submission Date</th>
            <th>Fee Term</th>
            <th class="text-right">Total Amount</th>
            <th class="text-right">Deposit</th>
            <th class="text-right">Due-able</th>
          </tr>
        </thead>
        <tbody>
          ${historyRows}
        </tbody>
      </table>

      <div class="receipt-footer">
        <div class="receipt-footer-row">
          <div class="receipt-footer-cell">
            <div class="muted">Prepared By</div>
            <div>${esc(schoolName)}</div>
          </div>
          <div class="receipt-footer-cell">
            <div class="muted">Checked By</div>
            <div>&nbsp;</div>
          </div>
          <div class="receipt-footer-cell">
            <div class="muted">Accounts Department</div>
            <div>${esc(schoolName)}</div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>`;
}

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
  const [printing, setPrinting] = useState(false);

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

  const handlePrintReceipt = async (paymentId: string) => {
    if (!paymentId || !selectedStudentId || printing) return;
    try {
      setPrinting(true);
      const [receipt, school] = await Promise.all([
        fetchApi(`/Fees/receipt/${encodeURIComponent(paymentId)}`) as Promise<FeeReceiptDto>,
        fetchApi("/SchoolProfile").catch(() => null) as Promise<SchoolProfileDto | null>,
      ]);
      if (!receipt) {
        toast({ title: "Error", description: "Receipt not found.", variant: "destructive" });
        return;
      }
      if (typeof window === "undefined") return;
      const html = buildReceiptHtml(receipt, school);
      const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to print receipt", variant: "destructive" });
    } finally {
      setPrinting(false);
    }
  };

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
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.paidAt).toLocaleDateString()}</TableCell>
                      <TableCell>{p.receiptNumber}</TableCell>
                      <TableCell>{p.mode}</TableCell>
                      <TableCell>{formatCurrency(p.amount)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={printing}
                          onClick={() => handlePrintReceipt(p.id)}
                        >
                          Print receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
