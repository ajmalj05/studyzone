import type { FeeReceiptDto } from "@/types/fees";

export interface SchoolProfileForReceipt {
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

export function buildReceiptHtml(receipt: FeeReceiptDto, school: SchoolProfileForReceipt | null): string {
  const schoolName = school?.name || "Studyzone Private Institute";
  const logoUrl =
    school?.logoUrl || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");
  const guardianName = receipt.guardianName ?? "—";
  const className = receipt.className ?? "—";
  const feeTerm = receipt.feeTerm ?? "—";
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
  `;

  const particularsRows =
    particulars.length > 0
      ? particulars
          .map(
            (p, index) =>
              `<tr><td>${index + 1}</td><td>${esc(String(p.name))}</td><td class="text-right">${currency}${Number(p.amount).toLocaleString("en-AE")}</td></tr>`
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
            <p class="receipt-contact">${esc(school?.address || "")}${school?.phone ? " | " + esc(school.phone) : ""}${school?.email ? " | " + esc(school.email) : ""}</p>
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
        <tbody>${particularsRows}</tbody>
      </table>
      <div class="receipt-footer">
        <div class="receipt-footer-row">
          <div class="receipt-footer-cell"><div class="muted">Prepared By</div><div>${esc(schoolName)}</div></div>
          <div class="receipt-footer-cell"><div class="muted">Checked By</div><div>&nbsp;</div></div>
          <div class="receipt-footer-cell"><div class="muted">Accounts Department</div><div>${esc(schoolName)}</div></div>
        </div>
      </div>
    </div>
    <script>window.onload=function(){window.print();}</script>
  </body>
  </html>`;
}
