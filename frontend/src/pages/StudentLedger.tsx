import { useState, useEffect } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useAcademicYear } from "@/context/AcademicYearContext";
import { FeeLedgerDto, StudentDto, ClassDto, BatchDto, FEE_MONTH_NAMES, formatCurrency, FeeReceiptDto, StudentFeeOfferDto } from "@/types/fees";

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
  const paidDate = receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString() : "—";
  const particulars = receipt.particulars ?? [];
  const currency = receipt.currencySymbol ?? "AED ";

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
                "en-AE"
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
          <td class="label"></td><td class="value"></td>
        </tr>
        <tr>
          <td class="label">Class</td><td class="value">${esc(className)}</td>
          <td class="label">Total Amount</td><td class="value text-right">${currency}${receipt.totalCharges.toLocaleString("en-AE")}</td>
        </tr>
        <tr>
          <td class="label"></td><td class="value"></td>
          <td class="label">Deposit Amount</td><td class="value text-right">${currency}${receipt.deposit.toLocaleString("en-AE")}</td>
        </tr>
        <tr>
          <td class="label"></td><td class="value"></td>
          <td class="label">Remaining Balance</td><td class="value text-right">${currency}${receipt.remainingBalance.toLocaleString("en-AE")}</td>
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
  const currency = "AED ";

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
                <td class="text-right">${currency}${Number(c.amount).toLocaleString("en-AE")}</td>
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
                <td>${esc((p.feeType && String(p.feeType).trim()) ? String(p.feeType).trim() : "General")}</td>
                <td>${esc(p.receiptNumber)}</td>
                <td>${esc(p.mode)}</td>
                <td class="text-right">${currency}${Number(p.amount).toLocaleString("en-AE")}</td>
              </tr>`
          )
          .join("")
      : "<tr><td colspan=\"5\" class=\"text-right\">No payments</td></tr>";

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
        <strong>Total charges:</strong> ${currency}${Number(ledger.totalCharges).toLocaleString("en-AE")} &nbsp;|&nbsp;
        <strong>Total payments:</strong> ${currency}${Number(ledger.totalPayments).toLocaleString("en-AE")} &nbsp;|&nbsp;
        <strong>Balance:</strong> ${currency}${Number(ledger.balance).toLocaleString("en-AE")}
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
            <tr><th>Date</th><th>Fee type</th><th>Receipt</th><th>Mode</th><th class="text-right">Amount</th></tr>
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
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [studentFeeOffer, setStudentFeeOffer] = useState<StudentFeeOfferDto | null>(null);

  usePageHeaderConfigEffect(
    {
      title: "Student billing",
      description: "Manage one student's charges, payments, concessions, and receipts.",
    },
    [],
  );

  const loadStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedYearId) params.set("academicYearId", selectedYearId);
      params.set("take", "500");
      const res = (await fetchApi(`/Students?${params.toString()}`)) as { items: StudentDto[] };
      setStudents(res.items ?? []);
    } catch {
      setStudents([]);
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

  useEffect(() => {
    setSelectedPaymentIds([]);
  }, [selectedStudentId]);

  useEffect(() => {
    setSelectedPaymentIds((prev) => prev.filter((id) => ledger?.payments?.some((p) => p.id === id)));
  }, [ledger]);

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

  const handlePrintSelectedReceipts = async () => {
    if (!ledger || selectedPaymentIds.length === 0 || printing) return;
    try {
      setPrinting(true);
      const school = (await fetchApi("/SchoolProfile").catch(() => null)) as SchoolProfileDto | null;
      const selectedStudent = filteredStudents.find((s) => s.id === selectedStudentId) ?? null;
      const receipts = await Promise.all(
        selectedPaymentIds.map(async (paymentId) => {
          try {
            return await fetchApi(`/Fees/receipt/${encodeURIComponent(paymentId)}`) as FeeReceiptDto;
          } catch {
            const p = ledger.payments.find((x) => x.id === paymentId);
            if (!p) return null;
            return {
              id: p.id,
              receiptNumber: p.receiptNumber,
              studentName: ledger.studentName,
              admissionNumber: selectedStudent?.admissionNumber || "",
              className: ledger.className,
              paidAt: p.paidAt,
              totalCharges: p.amount,
              deposit: p.amount,
              remainingBalance: 0,
              currencySymbol: "AED",
              particulars: [{ name: (p.feeType && String(p.feeType).trim()) ? String(p.feeType).trim() : "General", amount: p.amount }],
            } satisfies FeeReceiptDto;
          }
        })
      );

      const validReceipts = receipts.filter((r): r is FeeReceiptDto => !!r);
      if (validReceipts.length === 0) {
        toast({ title: "Error", description: "No selected receipts found.", variant: "destructive" });
        return;
      }

      const feeRows = validReceipts.flatMap((receipt) => {
        const paidDate = receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString() : "—";
        const particulars = receipt.particulars ?? [];
        if (particulars.length === 0) {
          return [{
            receiptNumber: receipt.receiptNumber,
            paidDate,
            name: "General",
            amount: Number(receipt.deposit ?? receipt.totalCharges ?? 0),
          }];
        }
        return particulars.map((particular) => ({
          receiptNumber: receipt.receiptNumber,
          paidDate,
          name: String(particular.name),
          amount: Number(particular.amount ?? 0),
        }));
      });

      const rowsHtml = feeRows
        .map(
          (row, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${esc(row.receiptNumber)}</td>
              <td>${esc(row.paidDate)}</td>
              <td>${esc(row.name)}</td>
              <td class="text-right">AED ${row.amount.toLocaleString("en-AE")}</td>
            </tr>
          `
        )
        .join("");
      const grandTotal = feeRows.reduce((sum, r) => sum + r.amount, 0);
      const schoolName = school?.name || "Studyzone Private Institute";
      const logoUrl = school?.logoUrl || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");
      const printDate = new Date().toLocaleString();

      const html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Selected Fees Receipt</title>
        <style>
          @page { size: A4; margin: 8mm; }
          body { margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11pt; }
          .sheet { max-width: 210mm; margin: 0 auto; padding: 10mm 8mm; color: #111827; }
          .receipt-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
          .receipt-header-left { display: flex; align-items: center; gap: 10px; }
          .receipt-logo { height: 52px; width: 52px; object-fit: contain; display: block; }
          .receipt-school-name { margin: 0; font-size: 1.25rem; font-weight: 700; }
          .receipt-tagline { margin: 0; font-size: 0.8rem; color: #555; }
          .receipt-contact { margin: 2px 0 0; font-size: 0.75rem; color: #555; }
          .receipt-grid { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 10px; font-size: 0.8rem; }
          .receipt-grid td { padding: 3px 6px; vertical-align: top; }
          .receipt-grid .label { font-weight: 600; width: 24%; }
          .receipt-grid .value { width: 26%; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 1px solid #d1d5db; padding: 5px 6px; font-size: 10.5px; vertical-align: top; }
          th { background: #f3f4f6; text-align: left; font-weight: 700; }
          .text-right { text-align: right; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="receipt-header">
            <div class="receipt-header-left">
              <img src="${esc(logoUrl)}" alt="School" class="receipt-logo" />
              <div>
                <h1 class="receipt-school-name">${esc(schoolName)}</h1>
                <p class="receipt-tagline">Fees Paid Receipt (Combined)</p>
                <p class="receipt-contact">${esc(school?.address || "")}${school?.phone ? " | " + esc(school.phone) : ""}${school?.email ? " | " + esc(school.email) : ""}</p>
              </div>
            </div>
          </div>
          <table class="receipt-grid">
            <tr>
              <td class="label">Student Name</td><td class="value">${esc(ledger.studentName || selectedStudent?.name || "—")}</td>
              <td class="label">Registration No</td><td class="value">${esc(selectedStudent?.admissionNumber || "—")}</td>
            </tr>
            <tr>
              <td class="label">Class</td><td class="value">${esc(ledger.className || "—")}</td>
              <td class="label">Generated</td><td class="value">${esc(printDate)}</td>
            </tr>
          </table>
          <table>
            <thead>
              <tr>
                <th style="width: 34px;">#</th>
                <th style="width: 110px;">Receipt #</th>
                <th style="width: 90px;">Date</th>
                <th>Fee particulars</th>
                <th style="width: 110px;" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr>
                <td colspan="4" class="text-right"><strong>Grand Total</strong></td>
                <td class="text-right"><strong>AED ${grandTotal.toLocaleString("en-AE")}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>`;

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank", "noopener,noreferrer,width=900,height=700");
      if (w) setTimeout(() => URL.revokeObjectURL(url), 5000);
      else {
        URL.revokeObjectURL(url);
        toast({ title: "Popup blocked", description: "Allow popups for this site to print selected receipts.", variant: "destructive" });
      }
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to print selected receipts", variant: "destructive" });
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
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-6 flex-wrap">
          <div>
            <CardTitle>Student billing</CardTitle>
            <CardDescription>View and manage charges, payments, concessions, and receipts for one student.</CardDescription>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Class</Label>
              <SearchableSelect
                value={classFilter || "all"}
                onValueChange={(v) => {
                  const next = v === "all" ? "" : v;
                  setClassFilter(next);
                  setBatchFilter("");
                }}
                placeholder="All classes"
                className="w-[160px]"
                options={[
                  { value: "all", label: "All classes" },
                  ...classes.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Batch</Label>
              <SearchableSelect
                value={batchFilter || "all"}
                onValueChange={(v) => setBatchFilter(v === "all" ? "" : v)}
                placeholder="All batches"
                className="w-[160px]"
                options={[
                  { value: "all", label: "All batches" },
                  ...batchesForClass.map((b) => ({ value: b.id, label: b.name })),
                ]}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <input
                className="w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
                placeholder="Name or admission #"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedStudentId && (
            <div className="mb-4 flex flex-wrap gap-2">
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
            </div>
          )}

          <div className="mt-2">
            <DataTable
              data={filteredStudents}
              columns={[
                { key: "name", header: "Name", cell: (s) => s.name },
                { key: "admissionNumber", header: "Admission #", cell: (s) => s.admissionNumber },
                { key: "className", header: "Class", cell: (s) => classes.find((c) => c.id === s.classId)?.name ?? "-" },
                { key: "batchName", header: "Batch", cell: (s) => batches.find((b) => b.id === s.batchId)?.name ?? "-" },
              ] as DataTableColumn<StudentDto>[]}
              keyExtractor={(s) => s.id}
              loading={loading}
              emptyMessage="No students found"
              onRowClick={(s) => setSelectedStudentId(s.id)}
            />
          </div>
          {ledger && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  <strong>Total charges:</strong> {formatCurrency(ledger.totalCharges)} | <strong>Total payments:</strong> {formatCurrency(ledger.totalPayments)} | <strong>Balance:</strong> {formatCurrency(ledger.balance)}
                  {studentFeeOffer && (
                    <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Concession: {studentFeeOffer.offerType === "PercentageDiscount" ? `${studentFeeOffer.value}%` : `AED ${Number(studentFeeOffer.value).toLocaleString("en-AE")} off`}
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={printing || selectedPaymentIds.length === 0}
                  onClick={handlePrintSelectedReceipts}
                >
                  Print selected ({selectedPaymentIds.length})
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
                    <TableHead className="w-[44px]">
                      <Checkbox
                        checked={ledger.payments.length > 0 && selectedPaymentIds.length === ledger.payments.length}
                        onCheckedChange={(checked) => {
                          setSelectedPaymentIds(checked ? ledger.payments.map((p) => p.id) : []);
                        }}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Fee type</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPaymentIds.includes(p.id)}
                          onCheckedChange={(checked) => {
                            setSelectedPaymentIds((prev) =>
                              checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>{new Date(p.paidAt).toLocaleDateString()}</TableCell>
                      <TableCell>{(p.feeType && String(p.feeType).trim()) ? String(p.feeType).trim() : "General"}</TableCell>
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
