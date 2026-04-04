import type { FeeReceiptDto } from "@/types/fees";

export interface SchoolProfileForReceipt {
  id: string;
  name: string;
  address?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
}

const esc = (value: string | undefined | null) => {
  const str = String(value ?? "");
  return str
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026#39;");
};

// Standard Studyzone document header and footer for all PDFs
// Uses SchoolProfileForReceipt as the canonical type

export function getDocumentHeader(school: SchoolProfileForReceipt | null, title: string): string {
  const schoolName = school?.name || "Studyzone Private Institute";
  const logoUrl = school?.logoUrl || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");
  
  return `
    <div class="doc-header">
      <div class="header-left">
        <img src="${esc(logoUrl)}" alt="School Logo" class="doc-logo" />
        <div class="header-text">
          <div class="school-name">${esc(schoolName)}</div>
          <div class="doc-title">${esc(title)}</div>
          ${school?.address ? `<div class="school-contact">${esc(school.address)}</div>` : ''}
          ${school?.phone ? `<div class="school-contact">Phone: ${esc(school.phone)}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

export function getDocumentFooter(school: SchoolProfileForReceipt | null): string {
  const schoolName = school?.name || "Studyzone Private Institute";
  
  return `
    <div class="doc-footer">
      <div class="footer-row">
        <div class="footer-cell">
          <div class="footer-label">Prepared By</div>
          <div class="footer-value">${esc(schoolName)}</div>
        </div>
        <div class="footer-cell">
          <div class="footer-label">Checked By</div>
          <div class="footer-value">&nbsp;</div>
        </div>
        <div class="footer-cell">
          <div class="footer-label">Accounts Department</div>
          <div class="footer-value">${esc(schoolName)}</div>
        </div>
      </div>
      <div class="footer-note">Page 1 of 1</div>
    </div>
  `;
}

export function getStandardDocumentCss(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: "Times New Roman", Times, serif; 
      font-size: 11pt; 
      color: #000; 
      background: #fff;
      line-height: 1.5;
    }
    .doc-container { 
      max-width: 210mm; 
      margin: 0 auto; 
      padding: 12mm 15mm; 
    }
    .doc-header { 
      display: flex; 
      align-items: center; 
      gap: 14px; 
      border-bottom: 3px double #000; 
      padding-bottom: 10px; 
      margin-bottom: 20px; 
    }
    .header-left { display: flex; align-items: center; gap: 14px; flex: 1; }
    .doc-logo { 
      height: 60px; 
      width: 60px; 
      object-fit: contain; 
      flex-shrink: 0; 
    }
    .header-text { flex: 1; }
    .school-name { 
      font-size: 1.4rem; 
      font-weight: 700; 
      letter-spacing: 0.02em; 
      margin-bottom: 2px;
    }
    .doc-title { 
      font-size: 0.9rem; 
      color: #444;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .school-contact { 
      font-size: 0.75rem; 
      color: #555; 
      margin-top: 2px; 
    }
    h1 { 
      font-size: 1.3rem; 
      margin-bottom: 16px; 
      color: #000;
    }
    .meta-info { 
      margin-bottom: 16px; 
      font-size: 0.9rem; 
    }
    .meta-info p { margin-bottom: 4px; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 16px; 
      font-size: 10pt;
    }
    th, td { 
      border: 1px solid #ccc; 
      padding: 8px 10px; 
      text-align: left; 
    }
    th { 
      background: #f3f4f6; 
      font-weight: 600; 
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .text-right { text-align: right; }
    .doc-footer { 
      margin-top: 30px; 
      border-top: 1px solid #ccc;
      padding-top: 20px;
    }
    .footer-row { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 20px;
    }
    .footer-cell { 
      text-align: center; 
      width: 30%; 
    }
    .footer-label { 
      color: #666; 
      font-size: 0.8rem;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer-value { 
      font-size: 0.85rem;
      font-weight: 600;
    }
    .footer-note { 
      text-align: right; 
      font-size: 0.75rem; 
      color: #888;
      margin-top: 10px;
    }
    .status-paid { color: #059669; font-weight: 600; }
    .status-unpaid { color: #dc2626; font-weight: 600; }
    .status-partial { color: #d97706; font-weight: 600; }
    @media print { 
      body { -webkit-print-color-adjust: exact; } 
      .doc-container { padding: 10mm; }
    }
  `;
}

export function buildReportHtml(
  title: string,
  content: string,
  school: SchoolProfileForReceipt | null,
  metaInfo?: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>${getStandardDocumentCss()}</style>
</head>
<body>
  <div class="doc-container">
    ${getDocumentHeader(school, title)}
    ${metaInfo ? `<div class="meta-info">${metaInfo}</div>` : ''}
    ${content}
    ${getDocumentFooter(school)}
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}

export function buildReceiptHtml(receipt: FeeReceiptDto, school: SchoolProfileForReceipt | null): string {
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
              `<tr><td>${index + 1}</td><td>${esc(String(p.name))}</td><td class="text-right">${currency}${Number(p.amount).toLocaleString("en-IN")}</td></tr>`
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