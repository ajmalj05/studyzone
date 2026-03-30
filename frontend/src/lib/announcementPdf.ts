// Reusable announcement PDF generator using the same structure as TeacherOfferLetter

export interface SchoolInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export interface AnnouncementPdfData {
  id: string;
  title: string;
  body?: string;
  audienceType?: string;
  targetName?: string;
  createdAt: string;
}

// Use Unicode escapes to prevent auto-formatter from breaking the strings
const esc = (value: string | undefined | null): string => {
  const str = String(value ?? "");
  return str
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026#39;");
};

export const buildAnnouncementPdfHtml = (
  announcement: AnnouncementPdfData,
  school: SchoolInfo
): string => {
  const schoolName = school.name || "Studyzone Private Institute";
  const logoUrl = school.logoUrl || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Times New Roman", Times, serif; font-size: 11pt; color: #000; background: #fff; }
    .doc { max-width: 210mm; margin: 0 auto; padding: 12mm 15mm; }
    .header { display: flex; align-items: center; gap: 14px; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 14px; }
    .logo { height: 60px; width: 60px; object-fit: contain; flex-shrink: 0; }
    .school-name { font-size: 1.4rem; font-weight: 700; letter-spacing: 0.02em; }
    .school-sub { font-size: 0.8rem; color: #555; margin-top: 2px; }
    .school-contact { font-size: 0.75rem; color: #555; margin-top: 2px; }
    .letter-meta { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 16px; }
    .doc-title { text-align: center; font-size: 1.2rem; font-weight: 700; margin-bottom: 30px; text-decoration: underline; }
    .subject { font-size: 14pt; font-weight: 700; margin-bottom: 20px; text-align: center; }
    .content { text-align: justify; white-space: pre-wrap; line-height: 1.8; font-size: 11pt; margin-bottom: 40px; }
    .doc-footer { margin-top: 60px; border-top: 1px solid #ccc; padding-top: 15px; font-size: 9pt; color: #666; text-align: center; }
    .signature-area { margin-top: 50px; display: flex; justify-content: space-between; font-size: 0.85rem; }
    .signature-box { text-align: center; width: 40%; }
    .signature-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; }
    .page-note { margin-top: 24px; text-align: right; font-size: 0.8rem; color: #666; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(announcement.title)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="doc">
    <div class="header">
      <img src="${esc(logoUrl)}" alt="School Logo" class="logo" />
      <div>
        <div class="school-name">${esc(schoolName)}</div>
        <div class="school-sub">Official Announcement / Circular</div>
        <div class="school-contact">${esc(school.address ?? "")}${school.phone ? " | " + esc(school.phone) : ""}${school.email ? " | " + esc(school.email) : ""}</div>
      </div>
    </div>
    <div class="letter-meta">
      <span><strong>Ref:</strong> ANN-${esc(announcement.id.slice(0, 8).toUpperCase())}</span>
      <span>${new Date(announcement.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
    </div>
    <div class="doc-title">ANNOUNCEMENT</div>
    <div class="subject">${esc(announcement.title)}</div>
    <div class="content">${esc(announcement.body || "No content provided.")}</div>
    <div class="signature-area">
      <div class="signature-box">
        <div class="signature-line">Prepared By</div>
        <div style="margin-top: 5px; font-size: 0.75rem; color: #555;">${esc(schoolName)}</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">Authorized By</div>
        <div style="margin-top: 5px; font-size: 0.75rem; color: #555;">Principal / Director</div>
      </div>
    </div>
    <div class="doc-footer">
      This is an official announcement from ${esc(schoolName)}.<br>
      For any queries, please contact the school administration.
    </div>
    <div class="page-note">Page 1 of 1</div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
};

export const openAnnouncementPdf = (
  announcement: AnnouncementPdfData,
  school: SchoolInfo
): void => {
  const html = buildAnnouncementPdfHtml(announcement, school);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 6000);
};