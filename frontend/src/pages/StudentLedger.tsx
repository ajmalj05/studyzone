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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useAcademicYear } from "@/context/AcademicYearContext";
import { CurrentAcademicYearBadge } from "@/components/CurrentAcademicYearBadge";
import { FeeLedgerDto, StudentDto, ClassDto, BatchDto, FEE_MONTH_NAMES, formatCurrency, FeeReceiptDto, AddAdmissionFeeResult, StudentFeeOfferDto } from "@/types/fees";

interface SchoolProfileDto {
  id: string;
  name: string;
  address?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
}

const esc = (value: string | undefined | null) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function buildReceiptHtml(receipt: FeeReceiptDto, school: SchoolProfileDto | null): string {
  const schoolName = school?.name || "Studyzone Private Institute";
  const logoUrl =
    school?.logoUrl || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");
  const guardianName = receipt.guardianName ?? "—";
  const className = receipt.className ?? "—";
  const feeTerm = receipt.feeTerm ?? "—";
  const paidDate = receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString() : "—";
  const particulars = receipt.particulars ?? [];
  const currency = receipt.currencySymbol ?? "₹";

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
    .page-break { page-break-after: always; }
  `;

  const particularsRows =
    particulars.length > 0
      ? particulars
              .map(
            (p, index) =>
              `<tr><td>${index + 1}</td><td>${esc(String(p.name))}</td><td class="text-right">${currency}${Number(p.amount).toLocaleString(
                "en-IN"
              )}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="3" class="muted">No fee particulars</td></tr>`;

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
    <script>window.onload=function(){window.print();}</script>
  </body>
  </html>`;
}

function buildLedgerPrintHtml(
  ledger: FeeLedgerDto,
  school: SchoolProfileDto | null,
  student?: StudentDto | null
): string {
  const schoolName = school?.name || "Studyzone Private Institute";
  const logoUrl =
    school?.logoUrl || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");
  const admissionNumber = student?.admissionNumber ?? "—";
  const currency = "₹";

  const printCss = `
    body { margin: 0; padding: 0; font-family: system-ui, sans-serif; font-size: 11pt; }
    .ledger-document { max-width: 210mm; margin: 0 auto; padding: 10mm 8mm; }
    .ledger-header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .ledger-logo { height: 52px; width: 52px; object-fit: contain; }
    .ledger-school-name { margin: 0; font-size: 1.25rem; font-weight: 700; }
    .ledger-title { margin: 4px 0 0; font-size: 0.9rem; color: #555; }
    .ledger-contact { margin: 2px 0 0; font-size: 0.75rem; color: #555; }
    .ledger-section { margin-top: 14px; }
    .ledger-section-title { font-size: 1rem; font-weight: 600; margin-bottom: 6px; }
    .ledger-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 6px; }
    .ledger-table th, .ledger-table td { border: 1px solid #333; padding: 5px 8px; text-align: left; }
    .ledger-table th { background: #f0f0f0; font-weight: 600; }
    .text-right { text-align: right; }
    .ledger-summary { margin-bottom: 12px; padding: 8px 10px; background: #f8f8f8; border: 1px solid #ddd; font-size: 0.9rem; }
    .ledger-footer { margin-top: 20px; font-size: 0.8rem; color: #666; }
  `;

  const chargesRows =
    (ledger.charges ?? []).length > 0
      ? (ledger.charges ?? [])
          .map(
            (c) =>
              `<tr>
                <td>${esc(c.particularName ?? c.description ?? c.period)}</td>
                <td>${esc(c.period)}</td>
                <td class="text-right">${currency}${Number(c.amount).toLocaleString("en-IN")}</td>
              </tr>`
          )
          .join("")
      : "<tr><td colspan=\"3\" class=\"text-right\">No charges</td></tr>";

  const paymentsRows =
    (ledger.payments ?? []).length > 0
      ? (ledger.payments ?? [])
          .map(
            (p) =>
              `<tr>
                <td>${p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</td>
                <td>${esc(p.receiptNumber)}</td>
                <td>${esc(p.mode)}</td>
                <td class="text-right">${currency}${Number(p.amount).toLocaleString("en-IN")}</td>
              </tr>`
          )
          .join("")
      : "<tr><td colspan=\"4\" class=\"text-right\">No payments</td></tr>";

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Student Fee Ledger - ${esc(ledger.studentName)}</title>
    <style>${printCss}</style>
  </head>
  <body>
    <div class="ledger-document">
      <div class="ledger-header">
        <img src="${esc(logoUrl)}" alt="School" class="ledger-logo" />
        <div>
          <h1 class="ledger-school-name">${esc(schoolName)}</h1>
          <p class="ledger-title">Student Fee Ledger</p>
          <p class="ledger-contact">${esc(school?.address ?? "")}${school?.phone ? " | " + esc(school.phone) : ""}${school?.email ? " | " + esc(school.email) : ""}</p>
        </div>
      </div>

      <div class="ledger-section">
        <p><strong>Student:</strong> ${esc(ledger.studentName)} &nbsp;|&nbsp; <strong>Registration No:</strong> ${esc(admissionNumber)} &nbsp;|&nbsp; <strong>Class:</strong> ${esc(ledger.className ?? "—")}</p>
      </div>

      <div class="ledger-summary">
        <strong>Total charges:</strong> ${currency}${Number(ledger.totalCharges).toLocaleString("en-IN")} &nbsp;|&nbsp;
        <strong>Total payments:</strong> ${currency}${Number(ledger.totalPayments).toLocaleString("en-IN")} &nbsp;|&nbsp;
        <strong>Balance:</strong> ${currency}${Number(ledger.balance).toLocaleString("en-IN")}
      </div>

      <div class="ledger-section">
        <div class="ledger-section-title">Charges</div>
        <table class="ledger-table">
          <thead>
            <tr><th>Particular / Fee type</th><th>Period</th><th class="text-right">Amount</th></tr>
          </thead>
          <tbody>${chargesRows}</tbody>
        </table>
      </div>

      <div class="ledger-section">
        <div class="ledger-section-title">Payments</div>
        <table class="ledger-table">
          <thead>
            <tr><th>Date</th><th>Receipt</th><th>Mode</th><th class="text-right">Amount</th></tr>
          </thead>
          <tbody>${paymentsRows}</tbody>
        </table>
      </div>

      <div class="ledger-footer">
        Printed on ${new Date().toLocaleString()} &nbsp;|&nbsp; ${esc(schoolName)}
      </div>
    </div>
    <script>window.onload=function(){window.print();}</script>
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
  const [admissionFeeOpen, setAdmissionFeeOpen] = useState(false);
  const [admissionFeeAmount, setAdmissionFeeAmount] = useState("");
  const [admissionFeeRecordPayment, setAdmissionFeeRecordPayment] = useState(true);
  const [admissionFeeSubmitting, setAdmissionFeeSubmitting] = useState(false);
  const [studentFeeOffer, setStudentFeeOffer] = useState<StudentFeeOfferDto | null>(null);

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

  useEffect(() => {
    if (!selectedStudentId || !selectedYearId) {
      setStudentFeeOffer(null);
      return;
    }
    fetchApi(`/Fees/offers/student/${selectedStudentId}?academicYearId=${encodeURIComponent(selectedYearId)}`)
      .then((o) => setStudentFeeOffer(o as StudentFeeOfferDto))
      .catch(() => setStudentFeeOffer(null));
  }, [selectedStudentId, selectedYearId]);

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

  const handleAddAdmissionFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    const amount = Number(admissionFeeAmount);
    if (!admissionFeeAmount.trim() || isNaN(amount) || amount <= 0) {
      toast({ title: "Validation", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }
    try {
      setAdmissionFeeSubmitting(true);
      const result = (await fetchApi("/Fees/admission-fee", {
        method: "POST",
        body: JSON.stringify({
          studentId: selectedStudentId,
          amount,
          recordPayment: admissionFeeRecordPayment,
          paymentMode: "Cash",
        }),
      })) as AddAdmissionFeeResult;
      toast({
        title: "Admission fee added",
        description: admissionFeeRecordPayment && result.receiptNumber
          ? `Charge and payment recorded. Receipt: ${result.receiptNumber}`
          : "Charge added. Record a payment from the ledger to print a receipt.",
      });
      setAdmissionFeeOpen(false);
      setAdmissionFeeAmount("");
      await loadLedger(selectedStudentId);
      if (admissionFeeRecordPayment && result.paymentId) {
        await handlePrintReceipt(result.paymentId);
      }
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message || "Failed to add admission fee", variant: "destructive" });
    } finally {
      setAdmissionFeeSubmitting(false);
    }
  };

  const handlePrintLedger = async () => {
    if (!ledger || printing) return;
    try {
      setPrinting(true);
      const school = (await fetchApi("/SchoolProfile").catch(() => null)) as SchoolProfileDto | null;
      const selectedStudent = filteredStudents.find((s) => s.id === selectedStudentId) ?? null;
      const html = buildLedgerPrintHtml(ledger, school, selectedStudent);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank", "noopener,noreferrer,width=900,height=700");
      if (w) setTimeout(() => URL.revokeObjectURL(url), 5000);
      else {
        URL.revokeObjectURL(url);
        toast({ title: "Popup blocked", description: "Allow popups for this site to print the ledger.", variant: "destructive" });
      }
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to print ledger", variant: "destructive" });
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintReceipt = async (paymentId: string) => {
    if (!paymentId || printing) return;
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
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank", "noopener,noreferrer,width=900,height=700");
      if (w) setTimeout(() => URL.revokeObjectURL(url), 5000);
      else {
        URL.revokeObjectURL(url);
        toast({ title: "Popup blocked", description: "Allow popups for this site to print the receipt.", variant: "destructive" });
      }
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
              <>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdmissionFeeOpen(true)}
                >
                  Add admission fee
                </Button>
              </>
            )}
          </div>

          <Dialog open={admissionFeeOpen} onOpenChange={setAdmissionFeeOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add admission fee</DialogTitle>
                <DialogDescription>
                  Enter the admission fee amount for this student. You can record payment now and print the receipt.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAdmissionFee} className="space-y-3">
                <div className="space-y-1">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={admissionFeeAmount}
                    onChange={(e) => setAdmissionFeeAmount(e.target.value)}
                    placeholder="e.g. 500"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="admission-record-payment"
                    checked={admissionFeeRecordPayment}
                    onChange={(e) => setAdmissionFeeRecordPayment(e.target.checked)}
                    className="rounded border-input"
                  />
                  <Label htmlFor="admission-record-payment">Record payment now and print receipt</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAdmissionFeeOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={admissionFeeSubmitting}>
                    {admissionFeeSubmitting ? "Adding…" : "Add admission fee"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  <strong>Total charges:</strong> {formatCurrency(ledger.totalCharges)} | <strong>Total payments:</strong> {formatCurrency(ledger.totalPayments)} | <strong>Balance:</strong> {formatCurrency(ledger.balance)}
                  {studentFeeOffer && (
                    <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Concession: {studentFeeOffer.offerType === "PercentageDiscount" ? `${studentFeeOffer.value}%` : `₹${Number(studentFeeOffer.value).toLocaleString("en-IN")} off`}
                    </span>
                  )}
                  {ledger.feePaymentStartMonth != null && ledger.feePaymentStartMonth >= 1 && ledger.feePaymentStartMonth <= 12 ? <> | <strong>Fees start from:</strong> {ledger.feePaymentStartYear != null ? `${FEE_MONTH_NAMES[ledger.feePaymentStartMonth - 1]} ${ledger.feePaymentStartYear}` : FEE_MONTH_NAMES[ledger.feePaymentStartMonth - 1]}</> : ""}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={printing}
                  onClick={handlePrintLedger}
                >
                  Print full ledger
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Particular / Fee type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.charges.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.particularName ?? c.description ?? c.period}</TableCell>
                      <TableCell>{c.period}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
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
