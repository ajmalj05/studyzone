import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Save, UserPlus, Printer } from "lucide-react";

const SPORTS = [
  "Football",
  "Basketball",
  "Cricket",
  "Badminton",
  "Table tennis",
  "Swimming",
  "Athletics",
  "Chess",
];
const ACTIVITIES = [
  "Music",
  "Elocution",
  "Quiz",
  "Debate",
  "Choir",
  "School Band",
  "Dramatics",
  "Art & Craft",
  "Self-defense",
];

interface ClassDto {
  id: string;
  name: string;
  code: string;
}
interface BatchDto {
  id: string;
  classId: string;
  name: string;
  section?: string;
}
interface SchoolProfileDto {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
}
interface SiblingRow {
  name: string;
  class: string;
}

const emptySibling = (): SiblingRow => ({ name: "", class: "" });

function toDateStr(d: string | undefined): string {
  if (!d) return "";
  try {
    const date = new Date(d);
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildPrintDocumentHtml(
  profile: SchoolProfileDto | null,
  form: Record<string, unknown>,
  classes: ClassDto[],
  batches: BatchDto[]
): string {
  const v = (key: string) => esc(String(form[key] ?? "—"));
  const classId = (form.classId as string) ?? "";
  const batchId = (form.batchId as string) ?? "";
  const className = classes.find((c) => c.id === classId)?.name ?? (classId || "—");
  const batchName = batches.find((b) => b.id === batchId)?.name ?? (batchId || "—");
  const schoolName = profile?.name || "Studyzone Private Institute";
  const logoUrl = profile?.logoUrl || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");
  const siblings = (form.otherChildrenInSchool as SiblingRow[] | undefined) ?? [];
  const siblingsFiltered = siblings.filter((r) => (r?.name ?? "").trim() || (r?.class ?? "").trim());
  const sports = Array.isArray(form.extraCurricularSports) ? (form.extraCurricularSports as string[]).join(", ") : "—";
  const activities = Array.isArray(form.extraCurricularActivities) ? (form.extraCurricularActivities as string[]).join(", ") : "—";
  const specialNeedsVal = form.anySpecialNeeds ? "Yes" + (form.anySpecialNeeds && form.specialNeedsDetails ? " – " + form.specialNeedsDetails : "") : "No";
  const specialNeedsDetail = form.anySpecialNeeds ? (form.specialNeedsDetails || "—") : "—";

  const printCss = `
    body { margin: 0; padding: 0; font-size: 11pt; }
    .print-form-document { max-width: 210mm; margin: 0 auto; padding: 10mm 8mm; padding-top: 10mm; }
    .print-form-header { display: flex; flex-direction: row; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #000; }
    .print-form-logo-wrap { flex-shrink: 0; }
    .print-form-logo { height: 64px; width: 64px; object-fit: contain; display: block; }
    .print-form-logo-placeholder { width: 64px; height: 64px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #999; }
    .print-form-school-name { margin: 0; font-size: 1.25rem; font-weight: bold; }
    .print-form-title { margin: 0.25rem 0 0 0; font-size: 0.95rem; font-weight: bold; letter-spacing: 0.02em; }
    .print-section { page-break-inside: avoid; margin-bottom: 1.25rem; padding: 0.75rem; border: 1px solid #333; }
    .print-section-title { margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: bold; color: #c2410c; }
    .print-section-desc { margin: 0 0 0.5rem 0; font-size: 0.85rem; color: #444; }
    .print-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    .print-table td, .print-table th { padding: 0.4rem 0.6rem; vertical-align: top; border: 1px solid #ccc; }
    .print-label { font-weight: 500; width: 38%; }
    .print-value { padding-left: 0.4rem; }
    .print-table-student .print-label { width: 22%; }
    .print-table-student .print-value { width: 28%; }
    .print-guardians-row { display: flex; gap: 1.5rem; flex-wrap: nowrap; }
    .print-guardians-row .print-section { flex: 1; min-width: 0; }
    .print-guardian-col .print-table .print-label { width: 42%; }
    .print-office-box { border: 1px solid #e07c2c; padding: 0.75rem 1rem; }
    .print-office-box .print-section-title { text-align: center; }
    .print-table-office .print-label { width: auto; min-width: 4em; }
    .print-declaration-text { margin: 0 0 0.5rem 0; font-size: 0.9rem; }
  `;

  const otherChildrenRows =
    siblingsFiltered.length > 0
      ? siblingsFiltered.map((row) => `<tr><td class="print-value">${esc(row?.name ?? "—")}</td><td class="print-value">${esc(row?.class ?? "—")}</td></tr>`).join("")
      : "<tr><td class=\"print-value\">—</td><td class=\"print-value\">—</td></tr>";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Admission Application Form</title><style>${printCss}</style></head><body>
<div class="print-form-document">
  <div class="print-form-header">
    <div class="print-form-logo-wrap"><img src="${esc(logoUrl)}" alt="School" class="print-form-logo" /></div>
    <div>
      <h1 class="print-form-school-name">${esc(schoolName)}</h1>
      <p class="print-form-title">ADMISSION APPLICATION FORM</p>
    </div>
  </div>
  <div class="print-section">
    <h2 class="print-section-title">Details of the Student</h2>
    <p class="print-section-desc">To be filled in by the parent (block letters)</p>
    <table class="print-table print-table-student"><tbody>
      <tr><td class="print-label" colspan="2">Academic Year:</td><td class="print-value" colspan="2">${v("academicYear")}</td></tr>
      <tr><td class="print-label" colspan="2">Name of the Student (as in Emirates ID):</td><td class="print-value" colspan="2">${v("studentName")}</td></tr>
      <tr><td class="print-label">Gender:</td><td class="print-value">${v("gender")}</td><td class="print-label">Place of Birth (as per passport):</td><td class="print-value">${v("placeOfBirth")}</td></tr>
      <tr><td class="print-label">Date of Birth:</td><td class="print-value">${v("dateOfBirth")}</td><td class="print-label">Nationality:</td><td class="print-value">${v("nationality")}</td></tr>
      <tr><td class="print-label">Religion:</td><td class="print-value">${v("religion")}</td><td class="print-label"></td><td class="print-value"></td></tr>
      <tr><td class="print-label">Name of Previous School:</td><td class="print-value">${v("previousSchool")}</td><td class="print-label">Previous Class:</td><td class="print-value">${v("previousClass")}</td></tr>
      <tr><td class="print-label">Emirate (if inside UAE):</td><td class="print-value">${v("emirateIfInsideUae")}</td><td class="print-label">Class Applied for:</td><td class="print-value">${v("classApplied")}</td></tr>
      <tr><td class="print-label">Country (if outside UAE):</td><td class="print-value">${v("countryIfOutsideUae")}</td><td class="print-label">Syllabus – Previous School:</td><td class="print-value">${v("syllabusPreviousSchool")}</td></tr>
      <tr><td class="print-label">2nd Lang in Previous School:</td><td class="print-value">${v("secondLangPreviousSchool")}</td><td class="print-label">Date of Last Attendance:</td><td class="print-value">${v("dateOfLastAttendance")}</td></tr>
      <tr><td class="print-label">Passport No:</td><td class="print-value">${v("passportNo")}</td><td class="print-label">Place of Issue (Passport):</td><td class="print-value">${v("passportPlaceOfIssue")}</td></tr>
      <tr><td class="print-label">Date of Issue (Passport):</td><td class="print-value">${v("passportDateOfIssue")}</td><td class="print-label">Date of Expiry (Passport):</td><td class="print-value">${v("passportDateOfExpiry")}</td></tr>
      <tr><td class="print-label">Residence Visa No:</td><td class="print-value">${v("residenceVisaNo")}</td><td class="print-label">Place of Issue (Residence Visa):</td><td class="print-value">${v("residenceVisaPlaceOfIssue")}</td></tr>
      <tr><td class="print-label">Date of Issue (Residence Visa):</td><td class="print-value">${v("residenceVisaDateOfIssue")}</td><td class="print-label">Date of Expiry (Residence Visa):</td><td class="print-value">${v("residenceVisaDateOfExpiry")}</td></tr>
      <tr><td class="print-label">Emirates ID No:</td><td class="print-value">${v("emiratesIdNo")}</td><td class="print-label">Date of Expiry (Emirates ID):</td><td class="print-value">${v("emiratesIdDateOfExpiry")}</td></tr>
      <tr><td class="print-label">Any Special Needs:</td><td class="print-value">${esc(specialNeedsVal)}</td><td class="print-label">If Yes, Please mention:</td><td class="print-value">${esc(specialNeedsDetail)}</td></tr>
      <tr><td class="print-label">Passport Size Photo URL:</td><td class="print-value" colspan="3">${v("passportPhotoUrl")}</td></tr>
    </tbody></table>
  </div>
  <div class="print-section">
    <h2 class="print-section-title">Extra-curricular activities</h2>
    <p class="print-section-desc">Put a tick in the areas of interest</p>
    <p><strong>Sports/Games:</strong> ${esc(sports)}</p>
    <p><strong>Extra-curricular activities:</strong> ${esc(activities)}</p>
  </div>
  <div class="print-guardians-row">
    <div class="print-section print-guardian-col">
      <h2 class="print-section-title">Personal Information – Father/Guardian</h2>
      <table class="print-table"><tbody>
        <tr><td class="print-label">Name as in Passport:</td><td class="print-value">${v("fatherNameAsInPassport")}</td></tr>
        <tr><td class="print-label">Religion:</td><td class="print-value">${v("fatherReligion")}</td></tr>
        <tr><td class="print-label">Nationality:</td><td class="print-value">${v("fatherNationality")}</td></tr>
        <tr><td class="print-label">Qualification:</td><td class="print-value">${v("fatherQualification")}</td></tr>
        <tr><td class="print-label">Mobile Number:</td><td class="print-value">${v("fatherMobileNumber")}</td></tr>
        <tr><td class="print-label">Email Address:</td><td class="print-value">${v("fatherEmailAddress")}</td></tr>
        <tr><td class="print-label">Occupation:</td><td class="print-value">${v("fatherOccupation")}</td></tr>
        <tr><td class="print-label">Company Name:</td><td class="print-value">${v("fatherCompanyName")}</td></tr>
        <tr><td class="print-label">Designation:</td><td class="print-value">${v("fatherDesignation")}</td></tr>
        <tr><td class="print-label">P.O.Box/Emirate:</td><td class="print-value">${v("fatherPoBoxEmirate")}</td></tr>
        <tr><td class="print-label">Office Telephone:</td><td class="print-value">${v("fatherOfficeTelephone")}</td></tr>
        <tr><td class="print-label">Emirates ID Number:</td><td class="print-value">${v("fatherEmiratesIdNumber")}</td></tr>
        <tr><td class="print-label">Address of Residence:</td><td class="print-value">${v("fatherAddressOfResidence")}</td></tr>
        <tr><td class="print-label">Address in Home Country:</td><td class="print-value">${v("fatherAddressInHomeCountry")}</td></tr>
      </tbody></table>
    </div>
    <div class="print-section print-guardian-col">
      <h2 class="print-section-title">Personal Information – Mother/Guardian</h2>
      <table class="print-table"><tbody>
        <tr><td class="print-label">Name as in Passport:</td><td class="print-value">${v("motherNameAsInPassport")}</td></tr>
        <tr><td class="print-label">Religion:</td><td class="print-value">${v("motherReligion")}</td></tr>
        <tr><td class="print-label">Nationality:</td><td class="print-value">${v("motherNationality")}</td></tr>
        <tr><td class="print-label">Qualification:</td><td class="print-value">${v("motherQualification")}</td></tr>
        <tr><td class="print-label">Mobile Number:</td><td class="print-value">${v("motherMobileNumber")}</td></tr>
        <tr><td class="print-label">Email Address:</td><td class="print-value">${v("motherEmailAddress")}</td></tr>
        <tr><td class="print-label">Occupation:</td><td class="print-value">${v("motherOccupation")}</td></tr>
        <tr><td class="print-label">Company Name:</td><td class="print-value">${v("motherCompanyName")}</td></tr>
        <tr><td class="print-label">Designation:</td><td class="print-value">${v("motherDesignation")}</td></tr>
        <tr><td class="print-label">P.O.Box/Emirate:</td><td class="print-value">${v("motherPoBoxEmirate")}</td></tr>
        <tr><td class="print-label">Office Telephone:</td><td class="print-value">${v("motherOfficeTelephone")}</td></tr>
        <tr><td class="print-label">Emirates ID Number:</td><td class="print-value">${v("motherEmiratesIdNumber")}</td></tr>
        <tr><td class="print-label">Address of Residence:</td><td class="print-value">${v("motherAddressOfResidence")}</td></tr>
        <tr><td class="print-label">Address in Home Country:</td><td class="print-value">${v("motherAddressInHomeCountry")}</td></tr>
      </tbody></table>
    </div>
  </div>
  <div class="print-section">
    <h2 class="print-section-title">Other Children Studying in City School</h2>
    <p class="print-section-desc">Fill if you have any other child studying in the school</p>
    <table class="print-table"><thead><tr><th class="print-label">Name</th><th class="print-label">Class</th></tr></thead><tbody>${otherChildrenRows}</tbody></table>
  </div>
  <div class="print-section">
    <h2 class="print-section-title">Declaration by the Parent/Guardian</h2>
    <p class="print-declaration-text">I hereby declare that the information given above is true and correct to the best of my knowledge and I will abide by the rules and regulations of the School.</p>
    <p><strong>Name and Signature of the Parent:</strong> ${v("declarationParentNameAndSignature")}</p>
    <p><strong>Date:</strong> ${v("declarationDate")}</p>
  </div>
  <div class="print-section print-office-box">
    <h2 class="print-section-title">For Office Use Only</h2>
    <table class="print-table print-table-office"><tbody>
      <tr><td class="print-label">Allotted Class:</td><td class="print-value">${esc(className)}</td><td class="print-label">SIS No:</td><td class="print-value">${v("sisNo")}</td><td class="print-label">Reg No:</td><td class="print-value">${v("regNo")}</td></tr>
      <tr><td class="print-label">Checked by:</td><td class="print-value">${v("checkedBy")}</td><td class="print-label">Signature:</td><td class="print-value">${v("officeSignature")}</td><td class="print-label">Principal:</td><td class="print-value">${v("principal")}</td></tr>
      <tr><td class="print-label">Batch:</td><td class="print-value" colspan="5">${esc(batchName)}</td></tr>
    </tbody></table>
  </div>
</div>
</body></html>`;
}

export default function ApplicationFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const enquiryId = searchParams.get("enquiryId") ?? undefined;
  const isNew = !id || id === "new";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileDto | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    academicYear: "",
    studentName: "",
    gender: "",
    placeOfBirth: "",
    dateOfBirth: "",
    nationality: "",
    religion: "",
    previousSchool: "",
    previousClass: "",
    emirateIfInsideUae: "",
    classApplied: "",
    countryIfOutsideUae: "",
    syllabusPreviousSchool: "",
    secondLangPreviousSchool: "",
    dateOfLastAttendance: "",
    passportNo: "",
    passportPlaceOfIssue: "",
    passportDateOfIssue: "",
    passportDateOfExpiry: "",
    residenceVisaNo: "",
    residenceVisaPlaceOfIssue: "",
    residenceVisaDateOfIssue: "",
    residenceVisaDateOfExpiry: "",
    emiratesIdNo: "",
    emiratesIdDateOfExpiry: "",
    anySpecialNeeds: false,
    specialNeedsDetails: "",
    passportPhotoUrl: "",
    classId: "",
    batchId: "",
    sisNo: "",
    regNo: "",
    checkedBy: "",
    officeSignature: "",
    principal: "",
    extraCurricularSports: [] as string[],
    extraCurricularActivities: [] as string[],
    fatherNameAsInPassport: "",
    fatherReligion: "",
    fatherNationality: "",
    fatherQualification: "",
    fatherMobileNumber: "",
    fatherEmailAddress: "",
    fatherOccupation: "",
    fatherCompanyName: "",
    fatherDesignation: "",
    fatherPoBoxEmirate: "",
    fatherOfficeTelephone: "",
    fatherEmiratesIdNumber: "",
    fatherAddressOfResidence: "",
    fatherAddressInHomeCountry: "",
    motherNameAsInPassport: "",
    motherReligion: "",
    motherNationality: "",
    motherQualification: "",
    motherMobileNumber: "",
    motherEmailAddress: "",
    motherOccupation: "",
    motherCompanyName: "",
    motherDesignation: "",
    motherPoBoxEmirate: "",
    motherOfficeTelephone: "",
    motherEmiratesIdNumber: "",
    motherAddressOfResidence: "",
    motherAddressInHomeCountry: "",
    otherChildrenInSchool: [emptySibling(), emptySibling(), emptySibling()] as SiblingRow[],
    declarationParentNameAndSignature: "",
    declarationDate: "",
  });

  const batchesForClass = form.classId
    ? batches.filter((b) => b.classId === form.classId)
    : [];

  useEffect(() => {
    (async () => {
      try {
        const [classesRes, batchesRes] = await Promise.all([
          fetchApi("/Classes"),
          fetchApi("/Batches"),
        ]);
        setClasses((classesRes as ClassDto[]) ?? []);
        setBatches((batchesRes as BatchDto[]) ?? []);
      } catch {
        setClasses([]);
        setBatches([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      (async () => {
        setLoading(true);
        try {
          const app = (await fetchApi(`/AdmissionApplications/${id}`)) as Record<string, unknown>;
          if (app && typeof app === "object") {
            setForm({
              academicYear: (app.academicYear as string) ?? "",
              studentName: (app.studentName as string) ?? "",
              gender: (app.gender as string) ?? "",
              placeOfBirth: (app.placeOfBirth as string) ?? "",
              dateOfBirth: toDateStr(app.dateOfBirth as string),
              nationality: (app.nationality as string) ?? "",
              religion: (app.religion as string) ?? "",
              previousSchool: (app.previousSchool as string) ?? "",
              previousClass: (app.previousClass as string) ?? "",
              emirateIfInsideUae: (app.emirateIfInsideUae as string) ?? "",
              classApplied: (app.classApplied as string) ?? "",
              countryIfOutsideUae: (app.countryIfOutsideUae as string) ?? "",
              syllabusPreviousSchool: (app.syllabusPreviousSchool as string) ?? "",
              secondLangPreviousSchool: (app.secondLangPreviousSchool as string) ?? "",
              dateOfLastAttendance: toDateStr(app.dateOfLastAttendance as string),
              passportNo: (app.passportNo as string) ?? "",
              passportPlaceOfIssue: (app.passportPlaceOfIssue as string) ?? "",
              passportDateOfIssue: toDateStr(app.passportDateOfIssue as string),
              passportDateOfExpiry: toDateStr(app.passportDateOfExpiry as string),
              residenceVisaNo: (app.residenceVisaNo as string) ?? "",
              residenceVisaPlaceOfIssue: (app.residenceVisaPlaceOfIssue as string) ?? "",
              residenceVisaDateOfIssue: toDateStr(app.residenceVisaDateOfIssue as string),
              residenceVisaDateOfExpiry: toDateStr(app.residenceVisaDateOfExpiry as string),
              emiratesIdNo: (app.emiratesIdNo as string) ?? "",
              emiratesIdDateOfExpiry: toDateStr(app.emiratesIdDateOfExpiry as string),
              anySpecialNeeds: (app.anySpecialNeeds as boolean) ?? false,
              specialNeedsDetails: (app.specialNeedsDetails as string) ?? "",
              passportPhotoUrl: (app.passportPhotoUrl as string) ?? "",
              classId: (app.classId as string) ?? "",
              batchId: (app.batchId as string) ?? "",
              sisNo: (app.sisNo as string) ?? "",
              regNo: (app.regNo as string) ?? "",
              checkedBy: (app.checkedBy as string) ?? "",
              officeSignature: (app.officeSignature as string) ?? "",
              principal: (app.principal as string) ?? "",
              extraCurricularSports: Array.isArray(app.extraCurricularSports) ? (app.extraCurricularSports as string[]) : [],
              extraCurricularActivities: Array.isArray(app.extraCurricularActivities) ? (app.extraCurricularActivities as string[]) : [],
              fatherNameAsInPassport: (app.fatherNameAsInPassport as string) ?? "",
              fatherReligion: (app.fatherReligion as string) ?? "",
              fatherNationality: (app.fatherNationality as string) ?? "",
              fatherQualification: (app.fatherQualification as string) ?? "",
              fatherMobileNumber: (app.fatherMobileNumber as string) ?? "",
              fatherEmailAddress: (app.fatherEmailAddress as string) ?? "",
              fatherOccupation: (app.fatherOccupation as string) ?? "",
              fatherCompanyName: (app.fatherCompanyName as string) ?? "",
              fatherDesignation: (app.fatherDesignation as string) ?? "",
              fatherPoBoxEmirate: (app.fatherPoBoxEmirate as string) ?? "",
              fatherOfficeTelephone: (app.fatherOfficeTelephone as string) ?? "",
              fatherEmiratesIdNumber: (app.fatherEmiratesIdNumber as string) ?? "",
              fatherAddressOfResidence: (app.fatherAddressOfResidence as string) ?? "",
              fatherAddressInHomeCountry: (app.fatherAddressInHomeCountry as string) ?? "",
              motherNameAsInPassport: (app.motherNameAsInPassport as string) ?? "",
              motherReligion: (app.motherReligion as string) ?? "",
              motherNationality: (app.motherNationality as string) ?? "",
              motherQualification: (app.motherQualification as string) ?? "",
              motherMobileNumber: (app.motherMobileNumber as string) ?? "",
              motherEmailAddress: (app.motherEmailAddress as string) ?? "",
              motherOccupation: (app.motherOccupation as string) ?? "",
              motherCompanyName: (app.motherCompanyName as string) ?? "",
              motherDesignation: (app.motherDesignation as string) ?? "",
              motherPoBoxEmirate: (app.motherPoBoxEmirate as string) ?? "",
              motherOfficeTelephone: (app.motherOfficeTelephone as string) ?? "",
              motherEmiratesIdNumber: (app.motherEmiratesIdNumber as string) ?? "",
              motherAddressOfResidence: (app.motherAddressOfResidence as string) ?? "",
              motherAddressInHomeCountry: (app.motherAddressInHomeCountry as string) ?? "",
              otherChildrenInSchool: Array.isArray(app.otherChildrenInSchool) && (app.otherChildrenInSchool as SiblingRow[]).length > 0
                ? (app.otherChildrenInSchool as SiblingRow[])
                : [emptySibling(), emptySibling(), emptySibling()],
              declarationParentNameAndSignature: (app.declarationParentNameAndSignature as string) ?? "",
              declarationDate: toDateStr(app.declarationDate as string),
            });
          }
        } catch (e) {
          toast({ title: "Error", description: (e as Error).message || "Failed to load application", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      })();
    } else if (isNew && enquiryId) {
      (async () => {
        try {
          const enq = (await fetchApi(`/Enquiries/${enquiryId}`)) as Record<string, unknown>;
          if (enq?.studentName) {
            setForm((f) => ({
              ...f,
              studentName: (enq.studentName as string) ?? "",
              fatherNameAsInPassport: (enq.guardianName as string) ?? f.fatherNameAsInPassport,
              fatherMobileNumber: (enq.phone as string) ?? f.fatherMobileNumber,
              fatherEmailAddress: (enq.email as string) ?? f.fatherEmailAddress,
              classApplied: (enq.classOfInterest as string) ?? f.classApplied,
            }));
          }
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [id, isNew, enquiryId]);

  const update = (key: keyof typeof form, value: string | string[] | boolean | SiblingRow[]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggleSport = (s: string) => {
    setForm((f) => ({
      ...f,
      extraCurricularSports: f.extraCurricularSports.includes(s)
        ? f.extraCurricularSports.filter((x) => x !== s)
        : [...f.extraCurricularSports, s],
    }));
  };
  const toggleActivity = (a: string) => {
    setForm((f) => ({
      ...f,
      extraCurricularActivities: f.extraCurricularActivities.includes(a)
        ? f.extraCurricularActivities.filter((x) => x !== a)
        : [...f.extraCurricularActivities, a],
    }));
  };

  const buildPayload = () => ({
    enquiryId: isNew ? enquiryId : undefined,
    academicYear: form.academicYear || undefined,
    studentName: form.studentName,
    gender: form.gender || undefined,
    placeOfBirth: form.placeOfBirth || undefined,
    dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
    nationality: form.nationality || undefined,
    religion: form.religion || undefined,
    previousSchool: form.previousSchool || undefined,
    previousClass: form.previousClass || undefined,
    emirateIfInsideUae: form.emirateIfInsideUae || undefined,
    classApplied: form.classApplied || undefined,
    countryIfOutsideUae: form.countryIfOutsideUae || undefined,
    syllabusPreviousSchool: form.syllabusPreviousSchool || undefined,
    secondLangPreviousSchool: form.secondLangPreviousSchool || undefined,
    dateOfLastAttendance: form.dateOfLastAttendance ? new Date(form.dateOfLastAttendance).toISOString() : undefined,
    passportNo: form.passportNo || undefined,
    passportPlaceOfIssue: form.passportPlaceOfIssue || undefined,
    passportDateOfIssue: form.passportDateOfIssue ? new Date(form.passportDateOfIssue).toISOString() : undefined,
    passportDateOfExpiry: form.passportDateOfExpiry ? new Date(form.passportDateOfExpiry).toISOString() : undefined,
    residenceVisaNo: form.residenceVisaNo || undefined,
    residenceVisaPlaceOfIssue: form.residenceVisaPlaceOfIssue || undefined,
    residenceVisaDateOfIssue: form.residenceVisaDateOfIssue ? new Date(form.residenceVisaDateOfIssue).toISOString() : undefined,
    residenceVisaDateOfExpiry: form.residenceVisaDateOfExpiry ? new Date(form.residenceVisaDateOfExpiry).toISOString() : undefined,
    emiratesIdNo: form.emiratesIdNo || undefined,
    emiratesIdDateOfExpiry: form.emiratesIdDateOfExpiry ? new Date(form.emiratesIdDateOfExpiry).toISOString() : undefined,
    anySpecialNeeds: form.anySpecialNeeds,
    specialNeedsDetails: form.specialNeedsDetails || undefined,
    passportPhotoUrl: form.passportPhotoUrl || undefined,
    classId: form.classId || undefined,
    batchId: form.batchId || undefined,
    sisNo: form.sisNo || undefined,
    regNo: form.regNo || undefined,
    checkedBy: form.checkedBy || undefined,
    officeSignature: form.officeSignature || undefined,
    principal: form.principal || undefined,
    extraCurricularSports: form.extraCurricularSports.length ? form.extraCurricularSports : undefined,
    extraCurricularActivities: form.extraCurricularActivities.length ? form.extraCurricularActivities : undefined,
    fatherNameAsInPassport: form.fatherNameAsInPassport || undefined,
    fatherReligion: form.fatherReligion || undefined,
    fatherNationality: form.fatherNationality || undefined,
    fatherQualification: form.fatherQualification || undefined,
    fatherMobileNumber: form.fatherMobileNumber || undefined,
    fatherEmailAddress: form.fatherEmailAddress || undefined,
    fatherOccupation: form.fatherOccupation || undefined,
    fatherCompanyName: form.fatherCompanyName || undefined,
    fatherDesignation: form.fatherDesignation || undefined,
    fatherPoBoxEmirate: form.fatherPoBoxEmirate || undefined,
    fatherOfficeTelephone: form.fatherOfficeTelephone || undefined,
    fatherEmiratesIdNumber: form.fatherEmiratesIdNumber || undefined,
    fatherAddressOfResidence: form.fatherAddressOfResidence || undefined,
    fatherAddressInHomeCountry: form.fatherAddressInHomeCountry || undefined,
    motherNameAsInPassport: form.motherNameAsInPassport || undefined,
    motherReligion: form.motherReligion || undefined,
    motherNationality: form.motherNationality || undefined,
    motherQualification: form.motherQualification || undefined,
    motherMobileNumber: form.motherMobileNumber || undefined,
    motherEmailAddress: form.motherEmailAddress || undefined,
    motherOccupation: form.motherOccupation || undefined,
    motherCompanyName: form.motherCompanyName || undefined,
    motherDesignation: form.motherDesignation || undefined,
    motherPoBoxEmirate: form.motherPoBoxEmirate || undefined,
    motherOfficeTelephone: form.motherOfficeTelephone || undefined,
    motherEmiratesIdNumber: form.motherEmiratesIdNumber || undefined,
    motherAddressOfResidence: form.motherAddressOfResidence || undefined,
    motherAddressInHomeCountry: form.motherAddressInHomeCountry || undefined,
    otherChildrenInSchool: form.otherChildrenInSchool.filter((r) => r.name.trim() || r.class.trim()).length
      ? form.otherChildrenInSchool.filter((r) => r.name.trim() || r.class.trim())
      : undefined,
    declarationParentNameAndSignature: form.declarationParentNameAndSignature || undefined,
    declarationDate: form.declarationDate ? new Date(form.declarationDate).toISOString() : undefined,
  });

  const handleSave = async () => {
    if (!form.studentName.trim()) {
      toast({ title: "Validation", description: "Student name is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = (await fetchApi("/AdmissionApplications", {
          method: "POST",
          body: JSON.stringify(buildPayload()),
        })) as { id: string };
        toast({ title: "Success", description: "Application created." });
        navigate(`/admin/admission/application/${created.id}`, { replace: true });
      } else {
        await fetchApi(`/AdmissionApplications/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...buildPayload(),
            batch: undefined,
            section: undefined,
            interviewDate: undefined,
            interviewNotes: undefined,
          }),
        });
        toast({ title: "Success", description: "Application updated." });
      }
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitAndEnroll = async () => {
    if (!form.studentName.trim() || !form.fatherNameAsInPassport?.trim() || !form.fatherMobileNumber?.trim() || !form.fatherEmailAddress?.trim() ||
        !form.motherNameAsInPassport?.trim() || !form.motherMobileNumber?.trim() || !form.motherEmailAddress?.trim()) {
      toast({ title: "Validation", description: "Student name and both guardians' name, mobile and email are required for enrollment.", variant: "destructive" });
      return;
    }
    if (isNew) {
      toast({ title: "Validation", description: "Save the application first, then use Submit & create student.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await fetchApi(`/AdmissionApplications/${id}/submit-and-enroll`, { method: "POST" });
      toast({ title: "Success", description: "Student created and enrolled." });
      navigate("/admin/admission", { replace: true });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message || "Failed to enroll", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = async () => {
    let profile: SchoolProfileDto | null = null;
    try {
      profile = (await fetchApi("/SchoolProfile")) as SchoolProfileDto | null;
      setSchoolProfile(profile ?? null);
    } catch {
      setSchoolProfile(null);
    }
    const html = buildPrintDocumentHtml(profile ?? null, form as Record<string, unknown>, classes, batches);
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(() => {
        printWin.focus();
        printWin.print();
        printWin.onafterprint = () => printWin.close();
      }, 500);
    } else {
      toast({ title: "Print blocked", description: "Allow popups to print.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <DashboardHeader title="Application" />
        <div className="flex justify-center min-h-[40vh] items-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/admission")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DashboardHeader title={isNew ? "New application" : "Application"} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}
          </Button>
          {!isNew && (
            <Button onClick={handleSubmitAndEnroll} disabled={submitting}>
              <UserPlus className="h-4 w-4 mr-2" /> {submitting ? "Submitting..." : "Submit & create student"}
            </Button>
          )}
        </div>
      </div>

      {/* Print-only: exact admission form document (hidden on screen) */}
      <div ref={printRef} className="hidden print:block print-form-document">
        <div className="print-form-header">
          <div className="print-form-logo-wrap">
            <img src={schoolProfile?.logoUrl || "/logo.png"} alt="School" className="print-form-logo" />
          </div>
          <div>
            <h1 className="print-form-school-name">{schoolProfile?.name || "Studyzone Private Institute"}</h1>
            <p className="print-form-title">ADMISSION APPLICATION FORM</p>
          </div>
        </div>

        <div className="print-section">
          <h2 className="print-section-title">Details of the Student</h2>
          <p className="print-section-desc">To be filled in by the parent (block letters)</p>
          <table className="print-table print-table-student">
            <tbody>
              <tr><td className="print-label" colSpan={2}>Academic Year:</td><td className="print-value" colSpan={2}>{form.academicYear || "—"}</td></tr>
              <tr><td className="print-label" colSpan={2}>Name of the Student (as in Emirates ID):</td><td className="print-value" colSpan={2}>{form.studentName || "—"}</td></tr>
              <tr>
                <td className="print-label">Gender:</td><td className="print-value">{form.gender || "—"}</td>
                <td className="print-label">Place of Birth (as per passport):</td><td className="print-value">{form.placeOfBirth || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">Date of Birth:</td><td className="print-value">{form.dateOfBirth || "—"}</td>
                <td className="print-label">Nationality:</td><td className="print-value">{form.nationality || "—"}</td>
              </tr>
              <tr><td className="print-label">Religion:</td><td className="print-value">{form.religion || "—"}</td><td className="print-label"></td><td className="print-value"></td></tr>
              <tr>
                <td className="print-label">Name of Previous School:</td><td className="print-value">{form.previousSchool || "—"}</td>
                <td className="print-label">Previous Class:</td><td className="print-value">{form.previousClass || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">Emirate (if inside UAE):</td><td className="print-value">{form.emirateIfInsideUae || "—"}</td>
                <td className="print-label">Class Applied for:</td><td className="print-value">{form.classApplied || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">Country (if outside UAE):</td><td className="print-value">{form.countryIfOutsideUae || "—"}</td>
                <td className="print-label">Syllabus – Previous School:</td><td className="print-value">{form.syllabusPreviousSchool || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">2nd Lang in Previous School:</td><td className="print-value">{form.secondLangPreviousSchool || "—"}</td>
                <td className="print-label">Date of Last Attendance:</td><td className="print-value">{form.dateOfLastAttendance || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">Passport No:</td><td className="print-value">{form.passportNo || "—"}</td>
                <td className="print-label">Place of Issue (Passport):</td><td className="print-value">{form.passportPlaceOfIssue || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">Date of Issue (Passport):</td><td className="print-value">{form.passportDateOfIssue || "—"}</td>
                <td className="print-label">Date of Expiry (Passport):</td><td className="print-value">{form.passportDateOfExpiry || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">Residence Visa No:</td><td className="print-value">{form.residenceVisaNo || "—"}</td>
                <td className="print-label">Place of Issue (Residence Visa):</td><td className="print-value">{form.residenceVisaPlaceOfIssue || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">Date of Issue (Residence Visa):</td><td className="print-value">{form.residenceVisaDateOfIssue || "—"}</td>
                <td className="print-label">Date of Expiry (Residence Visa):</td><td className="print-value">{form.residenceVisaDateOfExpiry || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">Emirates ID No:</td><td className="print-value">{form.emiratesIdNo || "—"}</td>
                <td className="print-label">Date of Expiry (Emirates ID):</td><td className="print-value">{form.emiratesIdDateOfExpiry || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">Any Special Needs:</td><td className="print-value">{form.anySpecialNeeds ? "Yes" : "No"}{form.anySpecialNeeds && form.specialNeedsDetails ? ` – ${form.specialNeedsDetails}` : ""}</td>
                <td className="print-label">If Yes, Please mention:</td><td className="print-value">{form.anySpecialNeeds ? (form.specialNeedsDetails || "—") : "—"}</td>
              </tr>
              <tr><td className="print-label">Passport Size Photo URL:</td><td className="print-value" colSpan={3}>{form.passportPhotoUrl || "—"}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2 className="print-section-title">Extra-curricular activities</h2>
          <p className="print-section-desc">Put a tick in the areas of interest</p>
          <p><strong>Sports/Games:</strong> {form.extraCurricularSports.length ? form.extraCurricularSports.join(", ") : "—"}</p>
          <p><strong>Extra-curricular activities:</strong> {form.extraCurricularActivities.length ? form.extraCurricularActivities.join(", ") : "—"}</p>
        </div>

        <div className="print-guardians-row">
          <div className="print-section print-guardian-col">
            <h2 className="print-section-title">Personal Information – Father/Guardian</h2>
            <table className="print-table">
              <tbody>
                <tr><td className="print-label">Name as in Passport:</td><td className="print-value">{form.fatherNameAsInPassport || "—"}</td></tr>
                <tr><td className="print-label">Religion:</td><td className="print-value">{form.fatherReligion || "—"}</td></tr>
                <tr><td className="print-label">Nationality:</td><td className="print-value">{form.fatherNationality || "—"}</td></tr>
                <tr><td className="print-label">Qualification:</td><td className="print-value">{form.fatherQualification || "—"}</td></tr>
                <tr><td className="print-label">Mobile Number:</td><td className="print-value">{form.fatherMobileNumber || "—"}</td></tr>
                <tr><td className="print-label">Email Address:</td><td className="print-value">{form.fatherEmailAddress || "—"}</td></tr>
                <tr><td className="print-label">Occupation:</td><td className="print-value">{form.fatherOccupation || "—"}</td></tr>
                <tr><td className="print-label">Company Name:</td><td className="print-value">{form.fatherCompanyName || "—"}</td></tr>
                <tr><td className="print-label">Designation:</td><td className="print-value">{form.fatherDesignation || "—"}</td></tr>
                <tr><td className="print-label">P.O.Box/Emirate:</td><td className="print-value">{form.fatherPoBoxEmirate || "—"}</td></tr>
                <tr><td className="print-label">Office Telephone:</td><td className="print-value">{form.fatherOfficeTelephone || "—"}</td></tr>
                <tr><td className="print-label">Emirates ID Number:</td><td className="print-value">{form.fatherEmiratesIdNumber || "—"}</td></tr>
                <tr><td className="print-label">Address of Residence:</td><td className="print-value">{form.fatherAddressOfResidence || "—"}</td></tr>
                <tr><td className="print-label">Address in Home Country:</td><td className="print-value">{form.fatherAddressInHomeCountry || "—"}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="print-section print-guardian-col">
            <h2 className="print-section-title">Personal Information – Mother/Guardian</h2>
            <table className="print-table">
              <tbody>
                <tr><td className="print-label">Name as in Passport:</td><td className="print-value">{form.motherNameAsInPassport || "—"}</td></tr>
                <tr><td className="print-label">Religion:</td><td className="print-value">{form.motherReligion || "—"}</td></tr>
                <tr><td className="print-label">Nationality:</td><td className="print-value">{form.motherNationality || "—"}</td></tr>
                <tr><td className="print-label">Qualification:</td><td className="print-value">{form.motherQualification || "—"}</td></tr>
                <tr><td className="print-label">Mobile Number:</td><td className="print-value">{form.motherMobileNumber || "—"}</td></tr>
                <tr><td className="print-label">Email Address:</td><td className="print-value">{form.motherEmailAddress || "—"}</td></tr>
                <tr><td className="print-label">Occupation:</td><td className="print-value">{form.motherOccupation || "—"}</td></tr>
                <tr><td className="print-label">Company Name:</td><td className="print-value">{form.motherCompanyName || "—"}</td></tr>
                <tr><td className="print-label">Designation:</td><td className="print-value">{form.motherDesignation || "—"}</td></tr>
                <tr><td className="print-label">P.O.Box/Emirate:</td><td className="print-value">{form.motherPoBoxEmirate || "—"}</td></tr>
                <tr><td className="print-label">Office Telephone:</td><td className="print-value">{form.motherOfficeTelephone || "—"}</td></tr>
                <tr><td className="print-label">Emirates ID Number:</td><td className="print-value">{form.motherEmiratesIdNumber || "—"}</td></tr>
                <tr><td className="print-label">Address of Residence:</td><td className="print-value">{form.motherAddressOfResidence || "—"}</td></tr>
                <tr><td className="print-label">Address in Home Country:</td><td className="print-value">{form.motherAddressInHomeCountry || "—"}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="print-section">
          <h2 className="print-section-title">Other Children Studying in City School</h2>
          <p className="print-section-desc">Fill if you have any other child studying in the school</p>
          <table className="print-table">
            <thead><tr><th className="print-label">Name</th><th className="print-label">Class</th></tr></thead>
            <tbody>
              {form.otherChildrenInSchool.filter((r) => r.name.trim() || r.class.trim()).length > 0
                ? form.otherChildrenInSchool.filter((r) => r.name.trim() || r.class.trim()).map((row, i) => (
                    <tr key={i}><td className="print-value">{row.name || "—"}</td><td className="print-value">{row.class || "—"}</td></tr>
                  ))
                : <tr><td className="print-value">—</td><td className="print-value">—</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2 className="print-section-title">Declaration by the Parent/Guardian</h2>
          <p className="print-declaration-text">I hereby declare that the information given above is true and correct to the best of my knowledge and I will abide by the rules and regulations of the School.</p>
          <p><strong>Name and Signature of the Parent:</strong> {form.declarationParentNameAndSignature || "—"}</p>
          <p><strong>Date:</strong> {form.declarationDate || "—"}</p>
        </div>

        <div className="print-section print-office-box">
          <h2 className="print-section-title">For Office Use Only</h2>
          <table className="print-table print-table-office">
            <tbody>
              <tr>
                <td className="print-label">Allotted Class:</td><td className="print-value">{classes.find((c) => c.id === form.classId)?.name ?? (form.classId || "—")}</td>
                <td className="print-label">SIS No:</td><td className="print-value">{form.sisNo || "—"}</td>
                <td className="print-label">Reg No:</td><td className="print-value">{form.regNo || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">Checked by:</td><td className="print-value">{form.checkedBy || "—"}</td>
                <td className="print-label">Signature:</td><td className="print-value">{form.officeSignature || "—"}</td>
                <td className="print-label">Principal:</td><td className="print-value">{form.principal || "—"}</td>
              </tr>
              <tr>
                <td className="print-label">Batch:</td><td className="print-value" colSpan={5}>{batches.find((b) => b.id === form.batchId)?.name ?? (form.batchId || "—")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Editable form (hidden when printing) */}
      <div className="space-y-6 print:hidden">
        {/* Section A: Details of the Student */}
        <Card>
          <CardHeader>
            <CardTitle>Details of the Student</CardTitle>
            <CardDescription>To be filled in by the parent (block letters)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <Input value={form.academicYear} onChange={(e) => update("academicYear", e.target.value)} placeholder="e.g. 2024-25" />
            </div>
            <div className="space-y-2">
              <Label>Name of the Student (as in Emirates ID) *</Label>
              <Input value={form.studentName} onChange={(e) => update("studentName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Place of Birth (as per passport) *</Label>
              <Input value={form.placeOfBirth} onChange={(e) => update("placeOfBirth", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nationality *</Label>
              <Input value={form.nationality} onChange={(e) => update("nationality", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Religion *</Label>
              <Input value={form.religion} onChange={(e) => update("religion", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Name of Previous School</Label>
              <Input value={form.previousSchool} onChange={(e) => update("previousSchool", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Previous Class</Label>
              <Input value={form.previousClass} onChange={(e) => update("previousClass", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Emirate (if inside UAE)</Label>
              <Input value={form.emirateIfInsideUae} onChange={(e) => update("emirateIfInsideUae", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Class Applied for</Label>
              <Input value={form.classApplied} onChange={(e) => update("classApplied", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Country (if outside UAE)</Label>
              <Input value={form.countryIfOutsideUae} onChange={(e) => update("countryIfOutsideUae", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Syllabus–Previous School *</Label>
              <Input value={form.syllabusPreviousSchool} onChange={(e) => update("syllabusPreviousSchool", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>2nd Lang in Previous School</Label>
              <Input value={form.secondLangPreviousSchool} onChange={(e) => update("secondLangPreviousSchool", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date of Last Attendance</Label>
              <Input type="date" value={form.dateOfLastAttendance} onChange={(e) => update("dateOfLastAttendance", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Passport No *</Label>
              <Input value={form.passportNo} onChange={(e) => update("passportNo", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Place of Issue (Passport) *</Label>
              <Input value={form.passportPlaceOfIssue} onChange={(e) => update("passportPlaceOfIssue", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date of Issue (Passport) *</Label>
              <Input type="date" value={form.passportDateOfIssue} onChange={(e) => update("passportDateOfIssue", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date of Expiry (Passport) *</Label>
              <Input type="date" value={form.passportDateOfExpiry} onChange={(e) => update("passportDateOfExpiry", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Residence Visa No *</Label>
              <Input value={form.residenceVisaNo} onChange={(e) => update("residenceVisaNo", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Place of Issue (Residence Visa) *</Label>
              <Input value={form.residenceVisaPlaceOfIssue} onChange={(e) => update("residenceVisaPlaceOfIssue", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date of Issue (Residence Visa) *</Label>
              <Input type="date" value={form.residenceVisaDateOfIssue} onChange={(e) => update("residenceVisaDateOfIssue", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date of Expiry (Residence Visa) *</Label>
              <Input type="date" value={form.residenceVisaDateOfExpiry} onChange={(e) => update("residenceVisaDateOfExpiry", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Emirates ID No *</Label>
              <Input value={form.emiratesIdNo} onChange={(e) => update("emiratesIdNo", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date of Expiry (Emirates ID) *</Label>
              <Input type="date" value={form.emiratesIdDateOfExpiry} onChange={(e) => update("emiratesIdDateOfExpiry", e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="specialNeeds" checked={form.anySpecialNeeds} onCheckedChange={(c) => update("anySpecialNeeds", !!c)} />
              <Label htmlFor="specialNeeds">Any Special Needs (Yes/No)</Label>
            </div>
            {form.anySpecialNeeds && (
              <div className="space-y-2 md:col-span-2">
                <Label>If Yes, Please mention</Label>
                <Input value={form.specialNeedsDetails} onChange={(e) => update("specialNeedsDetails", e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Passport Size Photo URL</Label>
              <Input value={form.passportPhotoUrl} onChange={(e) => update("passportPhotoUrl", e.target.value)} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        {/* Extra-curricular */}
        <Card>
          <CardHeader>
            <CardTitle>Extra-curricular activities</CardTitle>
            <CardDescription>Put a tick in the areas of interest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-orange-600 font-semibold">Sports/Games</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {SPORTS.map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <Checkbox id={`sport-${s}`} checked={form.extraCurricularSports.includes(s)} onCheckedChange={() => toggleSport(s)} />
                    <Label htmlFor={`sport-${s}`} className="font-normal">{s}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-orange-600 font-semibold">Extra-curricular activities</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {ACTIVITIES.map((a) => (
                  <div key={a} className="flex items-center gap-2">
                    <Checkbox id={`act-${a}`} checked={form.extraCurricularActivities.includes(a)} onCheckedChange={() => toggleActivity(a)} />
                    <Label htmlFor={`act-${a}`} className="font-normal">{a}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Father/Guardian */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information – Father/Guardian</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["fatherNameAsInPassport", "fatherReligion", "fatherNationality", "fatherQualification", "fatherMobileNumber", "fatherEmailAddress", "fatherOccupation", "fatherCompanyName", "fatherDesignation", "fatherPoBoxEmirate", "fatherOfficeTelephone", "fatherEmiratesIdNumber"] as const).map((key) => (
              <div key={key} className="space-y-2">
                <Label>
                  {key === "fatherNameAsInPassport" && "Name as in Passport *"}
                  {key === "fatherReligion" && "Religion"}
                  {key === "fatherNationality" && "Nationality"}
                  {key === "fatherQualification" && "Qualification"}
                  {key === "fatherMobileNumber" && "Mobile Number *"}
                  {key === "fatherEmailAddress" && "Email Address *"}
                  {key === "fatherOccupation" && "Occupation"}
                  {key === "fatherCompanyName" && "Company Name"}
                  {key === "fatherDesignation" && "Designation"}
                  {key === "fatherPoBoxEmirate" && "P.O.Box/Emirate"}
                  {key === "fatherOfficeTelephone" && "Office Telephone"}
                  {key === "fatherEmiratesIdNumber" && "Emirates ID Number"}
                </Label>
                <Input value={form[key]} onChange={(e) => update(key, e.target.value)} type={key.includes("Email") ? "email" : "text"} />
              </div>
            ))}
            <div className="space-y-2 md:col-span-2">
              <Label>Address of Residence</Label>
              <Input value={form.fatherAddressOfResidence} onChange={(e) => update("fatherAddressOfResidence", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address in Home Country</Label>
              <Input value={form.fatherAddressInHomeCountry} onChange={(e) => update("fatherAddressInHomeCountry", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Mother/Guardian */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information – Mother/Guardian</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["motherNameAsInPassport", "motherReligion", "motherNationality", "motherQualification", "motherMobileNumber", "motherEmailAddress", "motherOccupation", "motherCompanyName", "motherDesignation", "motherPoBoxEmirate", "motherOfficeTelephone", "motherEmiratesIdNumber"] as const).map((key) => (
              <div key={key} className="space-y-2">
                <Label>
                  {key === "motherNameAsInPassport" && "Name as in Passport *"}
                  {key === "motherReligion" && "Religion"}
                  {key === "motherNationality" && "Nationality"}
                  {key === "motherQualification" && "Qualification"}
                  {key === "motherMobileNumber" && "Mobile Number *"}
                  {key === "motherEmailAddress" && "Email Address *"}
                  {key === "motherOccupation" && "Occupation"}
                  {key === "motherCompanyName" && "Company Name"}
                  {key === "motherDesignation" && "Designation"}
                  {key === "motherPoBoxEmirate" && "P.O.Box/Emirate"}
                  {key === "motherOfficeTelephone" && "Office Telephone"}
                  {key === "motherEmiratesIdNumber" && "Emirates ID Number"}
                </Label>
                <Input value={form[key]} onChange={(e) => update(key, e.target.value)} type={key.includes("Email") ? "email" : "text"} />
              </div>
            ))}
            <div className="space-y-2 md:col-span-2">
              <Label>Address of Residence</Label>
              <Input value={form.motherAddressOfResidence} onChange={(e) => update("motherAddressOfResidence", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address in Home Country</Label>
              <Input value={form.motherAddressInHomeCountry} onChange={(e) => update("motherAddressInHomeCountry", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Other children in school */}
        <Card>
          <CardHeader>
            <CardTitle>Other Children Studying in City School</CardTitle>
            <CardDescription>Fill if you have any other child studying in the school</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Class</TableHead></TableRow></TableHeader>
              <TableBody>
                {form.otherChildrenInSchool.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Input value={row.name} onChange={(e) => {
                        const next = [...form.otherChildrenInSchool];
                        next[i] = { ...next[i], name: e.target.value };
                        update("otherChildrenInSchool", next);
                      }} placeholder="Name" />
                    </TableCell>
                    <TableCell>
                      <Input value={row.class} onChange={(e) => {
                        const next = [...form.otherChildrenInSchool];
                        next[i] = { ...next[i], class: e.target.value };
                        update("otherChildrenInSchool", next);
                      }} placeholder="Class" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Declaration */}
        <Card>
          <CardHeader>
            <CardTitle>Declaration by the Parent/Guardian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              I hereby declare that the information given above is true and correct to the best of my knowledge and I will abide by the rules and regulations of the School.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name and Signature of the Parent</Label>
                <Input value={form.declarationParentNameAndSignature} onChange={(e) => update("declarationParentNameAndSignature", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.declarationDate} onChange={(e) => update("declarationDate", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* For Office Use Only */}
        <Card>
          <CardHeader>
            <CardTitle>For Office Use Only</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Allotted Class</Label>
              <Select value={form.classId} onValueChange={(v) => update("classId", v)}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={form.batchId} onValueChange={(v) => update("batchId", v)} disabled={!form.classId}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {batchesForClass.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}{b.section ? ` (${b.section})` : ""}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SIS No</Label>
              <Input value={form.sisNo} onChange={(e) => update("sisNo", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reg No</Label>
              <Input value={form.regNo} onChange={(e) => update("regNo", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Checked by</Label>
              <Input value={form.checkedBy} onChange={(e) => update("checkedBy", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Signature</Label>
              <Input value={form.officeSignature} onChange={(e) => update("officeSignature", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Principal</Label>
              <Input value={form.principal} onChange={(e) => update("principal", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          html, body { margin: 0; padding: 0; height: auto !important; min-height: 0 !important; overflow: visible !important; }
          #root, #root > div { min-height: 0 !important; height: auto !important; overflow: visible !important; }
          aside.fixed.left-0 { display: none !important; }
          main { margin-left: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; overflow: visible !important; }
          .print-form-document { display: block !important; max-width: 210mm; margin: 0 auto; padding: 10mm 8mm; padding-top: 10mm; font-size: 11pt; overflow: visible !important; }
          .print-form-header { display: flex !important; flex-direction: row !important; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #000; }
          .print-form-logo-wrap { flex-shrink: 0; }
          .print-form-logo { height: 64px; width: 64px; object-fit: contain; display: block; }
          .print-form-logo-placeholder { width: 64px; height: 64px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #999; }
          .print-form-school-name { margin: 0; font-size: 1.25rem; font-weight: bold; }
          .print-form-title { margin: 0.25rem 0 0 0; font-size: 0.95rem; font-weight: bold; letter-spacing: 0.02em; }
          .print-section { page-break-inside: avoid; margin-bottom: 1.25rem; padding: 0.75rem; border: 1px solid #333; }
          .print-section-title { margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: bold; color: #c2410c; }
          .print-section-desc { margin: 0 0 0.5rem 0; font-size: 0.85rem; color: #444; }
          .print-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
          .print-table td, .print-table th { padding: 0.4rem 0.6rem; vertical-align: top; border: 1px solid #ccc; min-height: 1.5em; }
          .print-label { font-weight: 500; width: 38%; }
          .print-value { padding-left: 0.4rem; }
          .print-table-student .print-label { width: 22%; }
          .print-table-student .print-value { width: 28%; }
          .print-table-student tr td:first-child.print-label { width: 22%; }
          .print-guardians-row { display: flex; gap: 1.5rem; flex-wrap: nowrap; }
          .print-guardians-row .print-section { flex: 1; min-width: 0; }
          .print-guardian-col .print-table .print-label { width: 42%; }
          .print-office-box { border: 1px solid #e07c2c; padding: 0.75rem 1rem; }
          .print-office-box .print-section-title { text-align: center; }
          .print-table-office .print-label { width: auto; min-width: 4em; }
          .print-table-office .print-value { width: auto; }
          .print-declaration-text { margin: 0 0 0.5rem 0; font-size: 0.9rem; }
        }
      `}</style>
    </div>
  );
}
