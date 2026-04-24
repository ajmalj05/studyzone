import { getDocumentHeader, getDocumentFooter, getStandardDocumentCss, type SchoolProfileForReceipt } from "./receiptHtml";

const esc = (v: string | undefined | null) =>
  String(v ?? "")
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026#39;");

const DAYS: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

export interface TimetableSlotForPdf {
  dayOfWeek: number;
  periodOrder: number;
  subject: string;
  batchName: string;
  room?: string;
}

export interface TimeBlockForPdf {
  type: "period" | "break";
  periodOrder?: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export function buildTimetablePdfHtml(
  timeline: TimeBlockForPdf[],
  slots: TimetableSlotForPdf[],
  daysInUse: number[],
  teacherName: string,
  school: SchoolProfileForReceipt | null,
): string {
  const getSlot = (day: number, period: number) =>
    slots.find((s) => s.dayOfWeek === day && s.periodOrder === period);

  const printed = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const dayHeaders = daysInUse.map((d) =>
    `<th>${DAYS[d] ?? `Day ${d}`}</th>`
  ).join("");

  const periodRows = timeline.map((block) => {
    if (block.type === "break") {
      return `
        <tr>
          <td class="tt-time-col" style="color:#b45309;font-size:7pt;">${esc(block.startTime)}</td>
          <td colspan="${daysInUse.length}" class="tt-break-cell">
            ☕ Break &middot; ${block.durationMinutes} min &middot; ${esc(block.startTime)} – ${esc(block.endTime)}
          </td>
        </tr>`;
    }
    const cells = daysInUse.map((d) => {
      const s = getSlot(d, block.periodOrder!);
      if (!s) return `<td class="tt-slot-empty"></td>`;
      return `
        <td class="tt-slot-filled">
          <div class="tt-subject">${esc(s.subject)}</div>
          <div class="tt-batch">${esc(s.batchName)}</div>
          ${s.room ? `<div class="tt-room">${esc(s.room)}</div>` : ""}
        </td>`;
    }).join("");
    return `
      <tr>
        <td class="tt-time-col">
          <div class="tt-p-label">P${block.periodOrder}</div>
          <div class="tt-p-time">${esc(block.startTime)}</div>
          <div class="tt-p-time">–${esc(block.endTime)}</div>
        </td>
        ${cells}
      </tr>`;
  }).join("");

  // Overrides on top of getStandardDocumentCss() to compact the layout for A4 landscape
  const overrideCss = `
    @page { size: A4 landscape; margin: 6mm 8mm; }

    /* shrink the shared container padding */
    .doc-container { padding: 0 !important; max-width: none !important; }

    /* shrink the shared header bottom gap */
    .doc-header { margin-bottom: 6px !important; padding-bottom: 6px !important; }
    .doc-logo { height: 44px !important; width: 44px !important; }

    /* shared footer top gap */
    .doc-footer { margin-top: 8px !important; padding-top: 8px !important; }
    .footer-row { margin-bottom: 8px !important; }

    /* timetable meta strip */
    .tt-meta { display:flex; gap:16px; font-size:7.5pt; color:#444;
               margin-bottom:6px; padding:3px 6px; background:#f9fafb;
               border:1px solid #e5e7eb; border-radius:3px; }
    .tt-meta strong { color:#000; }

    /* timetable table overrides */
    .tt-table { width:100%; border-collapse:collapse; font-size:8pt; margin-top:0; }
    .tt-table th { background:#f3f4f6; color:#000; font-weight:700;
                   text-transform:uppercase; font-size:7pt; letter-spacing:0.5px;
                   padding:4px 6px; text-align:center; border:1px solid #ccc; }
    .tt-table td { border:1px solid #d1d5db; vertical-align:top; }

    .tt-time-col { width:48px; min-width:48px; padding:5px 4px !important;
                   background:#fafafa; vertical-align:top; text-align:left; }
    .tt-p-label  { font-weight:700; font-size:7.5pt; color:#374151; }
    .tt-p-time   { font-size:6.5pt; color:#9ca3af; line-height:1.3; }

    .tt-slot-empty  { background:#fff; height:44px; }
    .tt-slot-filled { padding:4px 6px !important; background:#eff6ff; height:44px; vertical-align:top; }
    .tt-subject { font-weight:700; color:#1e3a8a; font-size:8pt; margin-bottom:1px; }
    .tt-batch   { color:#374151; font-size:7pt; }
    .tt-room    { color:#6b7280; font-size:6.5pt; margin-top:1px; }

    .tt-break-cell { text-align:center; background:#fffbeb; color:#b45309;
                     font-weight:600; font-size:7pt; text-transform:uppercase;
                     letter-spacing:0.4px; padding:3px 6px !important; height:20px; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Timetable — ${esc(teacherName)}</title>
  <style>${getStandardDocumentCss()}${overrideCss}</style>
</head>
<body>
  <div class="doc-container">
    ${getDocumentHeader(school, "Teaching Timetable")}

    <div class="tt-meta">
      <span><strong>Teacher:</strong> ${esc(teacherName)}</span>
      <span><strong>Periods assigned:</strong> ${slots.length}</span>
      <span style="margin-left:auto;"><strong>Printed:</strong> ${printed}</span>
    </div>

    <table class="tt-table">
      <thead>
        <tr>
          <th style="text-align:left;width:48px;">Time</th>
          ${dayHeaders}
        </tr>
      </thead>
      <tbody>
        ${periodRows}
      </tbody>
    </table>

    ${getDocumentFooter(school)}
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}
