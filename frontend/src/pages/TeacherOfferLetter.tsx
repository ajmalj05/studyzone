import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { FileText, UserPlus, Printer, Save, Plus, Trash2, Edit, RotateCcw, Check, X } from "lucide-react";

interface SchoolProfileDto {
  id: string;
  name: string;
  address?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
}

interface SavedOfferLetter {
  id: string;
  candidateName: string;
  designation?: string;
  joiningDate?: string;
  grossSalary: number;
  createdAt: string;
}

interface FieldConfig {
  id: string;
  fieldKey: string;
  label: string;
  defaultValue?: string;
  isVisible: boolean;
  showInPdf: boolean;
  isRequired: boolean;
  displayOrder: number;
  fieldType: string;
  section?: string;
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

const defaultForm = {
  candidateName: "",
  gender: "Mr" as const,
  candidateAddress: "",
  passportId: "",
  designation: "Teacher",
  subject: "",
  phone: "",
  registerNumber: "",
  letterDate: new Date().toISOString().slice(0, 10),
  refNumber: "",
  interviewDate: "",
  joiningDate: "",
  basicSalary: "",
  housingAllowance: "",
  transportAllowance: "",
  otherAllowances: "",
  visaStatus: "",
  medical: "Medical insurance for yourself and family.",
  leave: "30 calendar days of paid leave after completion of 12 calendar months of work. Leave ticket – economy class air ticket to country of origin for yourself and family.",
  joiningExpenses: "Currently non-anticipated.",
  probationPeriod: "You will be on probation for a period of 6 months effective from the date of joining.",
  additionalNotes: "",
};

const defaultFieldLabels: Record<string, string> = {
  candidateName: "Full Name",
  gender: "Title",
  candidateAddress: "Address / Location",
  passportId: "Passport / ID No.",
  registerNumber: "Register No. (Login ID)",
  designation: "Designation / Post",
  subject: "Subject",
  phone: "Phone",
  letterDate: "Letter Date",
  refNumber: "Ref. Number",
  interviewDate: "Interview Date",
  joiningDate: "Date of Joining",
  basicSalary: "Basic Salary (₹)",
  housingAllowance: "Housing Allowance (₹)",
  transportAllowance: "Transport Allowance (₹)",
  otherAllowances: "Other Allowances (₹)",
  visaStatus: "Visa Status",
  medical: "2. Medical",
  leave: "3. Leave",
  joiningExpenses: "4. Joining Expenses",
  probationPeriod: "5. Probation Period",
  additionalNotes: "Additional Notes (optional)",
};

export default function TeacherOfferLetter() {
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedLetters, setSavedLetters] = useState<SavedOfferLetter[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");
  const [loadingFields, setLoadingFields] = useState(true);
  
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfig>>({});
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editTempLabel, setEditTempLabel] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const gross =
    (parseFloat(form.basicSalary) || 0) +
    (parseFloat(form.housingAllowance) || 0) +
    (parseFloat(form.transportAllowance) || 0) +
    (parseFloat(form.otherAllowances) || 0);

  const loadFieldConfigs = async () => {
    setLoadingFields(true);
    try {
      const configs = await fetchApi("/OfferLetterFieldConfigs") as FieldConfig[];
      const configMap: Record<string, FieldConfig> = {};
      configs.forEach(config => {
        configMap[config.fieldKey] = config;
        if (config.isVisible && config.defaultValue && !form[config.fieldKey as keyof typeof form]) {
          setForm(prev => ({ ...prev, [config.fieldKey]: config.defaultValue }));
        }
      });
      setFieldConfigs(configMap);
    } catch (e) {
      const defaultConfigs: Record<string, FieldConfig> = {};
      Object.keys(defaultFieldLabels).forEach((key, index) => {
        defaultConfigs[key] = {
          id: key,
          fieldKey: key,
          label: defaultFieldLabels[key],
          isVisible: true,
          showInPdf: true,
          isRequired: ["candidateName", "registerNumber", "phone", "joiningDate", "basicSalary"].includes(key),
          displayOrder: index,
          fieldType: key === "gender" ? "select" : 
                    ["medical", "leave", "joiningExpenses", "probationPeriod", "additionalNotes"].includes(key) ? "textarea" :
                    ["letterDate", "interviewDate", "joiningDate"].includes(key) ? "date" :
                    ["basicSalary", "housingAllowance", "transportAllowance", "otherAllowances"].includes(key) ? "number" : "text",
          section: ["candidateName", "gender", "candidateAddress", "passportId", "registerNumber", "designation", "subject", "phone", "letterDate", "refNumber", "interviewDate", "joiningDate"].includes(key) ? "candidate" :
                   ["basicSalary", "housingAllowance", "transportAllowance", "otherAllowances", "visaStatus"].includes(key) ? "salary" : "terms"
        };
      });
      setFieldConfigs(defaultConfigs);
    } finally {
      setLoadingFields(false);
    }
  };

  const loadSavedLetters = async () => {
    setListLoading(true);
    try {
      const data = (await fetchApi("/TeacherOfferLetters")) as SavedOfferLetter[];
      setSavedLetters(Array.isArray(data) ? data : []);
    } catch (_) {
      setSavedLetters([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadFieldConfigs();
    loadSavedLetters();
  }, []);

  const isFieldActive = (key: string) => fieldConfigs[key]?.isVisible !== false;
  const getFieldLabel = (key: string) => fieldConfigs[key]?.label || defaultFieldLabels[key];

  const toggleFieldActive = async (key: string) => {
    const config = fieldConfigs[key];
    if (!config) return;
    
    const newIsVisible = !config.isVisible;
    
    try {
      await fetchApi(`/OfferLetterFieldConfigs/${config.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fieldKey: config.fieldKey,
          label: config.label,
          defaultValue: config.defaultValue,
          isVisible: newIsVisible,
          showInPdf: config.showInPdf,
          isRequired: config.isRequired,
          displayOrder: config.displayOrder,
          fieldType: config.fieldType,
          section: config.section
        })
      });
      
      setFieldConfigs(prev => ({
        ...prev,
        [key]: { ...prev[key], isVisible: newIsVisible }
      }));
    } catch (e) {
      toast({ title: "Error", description: "Failed to update field", variant: "destructive" });
    }
  };

  const startEditingLabel = (key: string) => {
    const config = fieldConfigs[key];
    if (!config || !config.isVisible) return;
    setEditingFieldId(config.id);
    setEditTempLabel(config.label);
  };

  const cancelEditingLabel = () => {
    setEditingFieldId(null);
    setEditTempLabel("");
  };

  const saveLabel = async (key: string) => {
    const config = fieldConfigs[key];
    if (!config) return;
    
    const newLabel = editTempLabel.trim();
    if (!newLabel) {
      cancelEditingLabel();
      return;
    }
    
    try {
      await fetchApi(`/OfferLetterFieldConfigs/${config.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fieldKey: config.fieldKey,
          label: newLabel,
          defaultValue: config.defaultValue,
          isVisible: config.isVisible,
          showInPdf: config.showInPdf,
          isRequired: config.isRequired,
          displayOrder: config.displayOrder,
          fieldType: config.fieldType,
          section: config.section
        })
      });
      
      setFieldConfigs(prev => ({
        ...prev,
        [key]: { ...prev[key], label: newLabel }
      }));
      
      setEditingFieldId(null);
      setEditTempLabel("");
    } catch (e) {
      toast({ title: "Error", description: "Failed to update label", variant: "destructive" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter') saveLabel(key);
    else if (e.key === 'Escape') cancelEditingLabel();
  };

  const handleSave = async () => {
    if (!form.candidateName) {
      toast({ title: "Validation", description: "Candidate name is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify({
        candidateName: form.candidateName,
        gender: form.gender,
        candidateAddress: form.candidateAddress || null,
        passportId: form.passportId || null,
        designation: form.designation,
        subject: form.subject || null,
        phone: form.phone,
        registerNumber: form.registerNumber,
        refNumber: form.refNumber || null,
        letterDate: form.letterDate || null,
        interviewDate: form.interviewDate || null,
        joiningDate: form.joiningDate || null,
        basicSalary: parseFloat(form.basicSalary) || 0,
        housingAllowance: parseFloat(form.housingAllowance) || 0,
        transportAllowance: parseFloat(form.transportAllowance) || 0,
        otherAllowances: parseFloat(form.otherAllowances) || 0,
        visaStatus: form.visaStatus || null,
        medical: form.medical,
        leave: form.leave,
        joiningExpenses: form.joiningExpenses,
        probationPeriod: form.probationPeriod,
        additionalNotes: form.additionalNotes || null,
        teacherUserId: null,
      });
      if (editingId) {
        await fetchApi(`/TeacherOfferLetters/${editingId}`, { method: "PUT", body });
        toast({ title: "Offer Letter Updated", description: `${form.candidateName}'s offer letter updated.` });
      } else {
        const created = (await fetchApi("/TeacherOfferLetters", { method: "POST", body })) as { id: string };
        setEditingId(created.id);
        toast({ title: "Offer Letter Saved", description: `${form.candidateName}'s offer letter saved to database.` });
      }
      await loadSavedLetters();
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const buildOfferLetterHtml = (school: SchoolProfileDto | null): string => {
    const schoolName = school?.name || "Studyzone Private Institute";
    const logoUrl = school?.logoUrl || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const basic = parseFloat(form.basicSalary) || 0;
    const housing = parseFloat(form.housingAllowance) || 0;
    const transport = parseFloat(form.transportAllowance) || 0;
    const other = parseFloat(form.otherAllowances) || 0;

    const currency = "₹";
    const fmt = (n: number) => n > 0 ? `${currency}${n.toLocaleString("en-IN")}` : `${currency}–`;
    
    // Check if field should show in PDF: must be active AND have value
    const showInPdf = (key: string) => isFieldActive(key) && (form as any)[key];

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
      .salutation { margin-bottom: 8px; font-size: 0.95rem; }
      .re-line { margin-bottom: 14px; font-size: 0.95rem; }
      .re-line u { font-weight: 600; }
      .intro { margin-bottom: 16px; line-height: 1.6; font-size: 0.92rem; }
      .section { margin-bottom: 14px; }
      .section-title { font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; }
      .salary-lead { font-style: italic; margin-bottom: 6px; font-size: 0.9rem; }
      .salary-table { width: 80%; font-size: 0.9rem; border-collapse: collapse; }
      .salary-table td { padding: 2px 6px; }
      .salary-table .lbl { font-weight: 600; width: 55%; }
      .salary-table .amt { text-align: right; }
      .salary-table .gross td { font-weight: 700; border-top: 1px solid #000; padding-top: 4px; }
      .doc-footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 0.85rem; }
      .doc-footer-cell { text-align: center; width: 30%; }
      .doc-footer-cell .sign-label { color: #555; }
      .page-note { margin-top: 24px; text-align: right; font-size: 0.8rem; color: #666; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `;

    // Build salary table rows only for active fields
    const salaryRows = [
      isFieldActive("basicSalary") ? `<tr><td class="lbl">${esc(getFieldLabel("basicSalary"))}</td><td class="amt">– ${fmt(basic)}</td></tr>` : "",
      isFieldActive("housingAllowance") ? `<tr><td class="lbl">${esc(getFieldLabel("housingAllowance"))}</td><td class="amt">– ${fmt(housing)}</td></tr>` : "",
      isFieldActive("transportAllowance") ? `<tr><td class="lbl">${esc(getFieldLabel("transportAllowance"))}</td><td class="amt">– ${fmt(transport)}</td></tr>` : "",
      isFieldActive("otherAllowances") ? `<tr><td class="lbl">${esc(getFieldLabel("otherAllowances"))}</td><td class="amt">– ${fmt(other)}</td></tr>` : ""
    ].filter(Boolean).join("");

    // Check if any salary fields are active
    const hasActiveSalaryFields = isFieldActive("basicSalary") || isFieldActive("housingAllowance") || 
                                  isFieldActive("transportAllowance") || isFieldActive("otherAllowances");

    // Build terms sections for active fields only
    const termsSections = [];
    let sectionNum = 2;
    
    if (isFieldActive("medical") && form.medical) {
      termsSections.push(`<div class="section"><div class="section-title">${sectionNum}. ${esc(getFieldLabel("medical").replace(/^\d+\.\s*/, ""))}</div><p style="font-size:0.92rem;">${esc(form.medical)}</p></div>`);
      sectionNum++;
    }
    if (isFieldActive("leave") && form.leave) {
      termsSections.push(`<div class="section"><div class="section-title">${sectionNum}. ${esc(getFieldLabel("leave").replace(/^\d+\.\s*/, ""))}</div><p style="font-size:0.92rem;">${esc(form.leave)}</p></div>`);
      sectionNum++;
    }
    if (isFieldActive("joiningExpenses") && form.joiningExpenses) {
      termsSections.push(`<div class="section"><div class="section-title">${sectionNum}. ${esc(getFieldLabel("joiningExpenses").replace(/^\d+\.\s*/, ""))}</div><p style="font-size:0.92rem;">${esc(form.joiningExpenses)}</p></div>`);
      sectionNum++;
    }
    if (isFieldActive("probationPeriod") && form.probationPeriod) {
      termsSections.push(`<div class="section"><div class="section-title">${sectionNum}. ${esc(getFieldLabel("probationPeriod").replace(/^\d+\.\s*/, ""))}</div><p style="font-size:0.92rem;">${esc(form.probationPeriod)}</p></div>`);
      sectionNum++;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Offer Letter – ${esc(form.candidateName)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="doc">
    <div class="header">
      <img src="${esc(logoUrl)}" alt="School Logo" class="logo" />
      <div>
        <div class="school-name">${esc(schoolName)}</div>
        <div class="school-sub">Offer of Employment</div>
        <div class="school-contact">${esc(school?.address ?? "")}${school?.phone ? " | " + esc(school.phone) : ""}${school?.email ? " | " + esc(school.email) : ""}</div>
      </div>
    </div>
    <div class="letter-meta">
      <span><strong>Ref:</strong> ${esc(showInPdf("refNumber") ? form.refNumber : "—")}</span>
      <span>${esc(isFieldActive("letterDate") ? (form.letterDate || today) : today)}</span>
    </div>
    <div class="salutation">
      <strong>${esc(form.candidateName ? (form.gender === "Ms" ? "Ms." : "Mr.") + " " + form.candidateName : "—")}</strong><br/>
      ${showInPdf("candidateAddress") ? esc(form.candidateAddress) : ""}
    </div>
    <div class="re-line">
      <u>Re: Offer of employment – ${esc(form.gender === "Ms" ? "Ms." : "Mr.")} ${esc(form.candidateName)} ${showInPdf("passportId") ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; National Passport no. / ID: ${esc(form.passportId)}` : ""}</u>
    </div>
    <div class="intro">
      With reference to your interview dated <strong>${esc(showInPdf("interviewDate") ? form.interviewDate : "—")}</strong>, we are pleased to confirm our offer of employment to you for the post of <strong>${esc(showInPdf("designation") ? form.designation : "—")}</strong> as per the terms and conditions outlined below.
    </div>
    ${hasActiveSalaryFields ? `
    <div class="section">
      <div class="section-title">1. Gross Salary Breakdown</div>
      <div class="salary-lead">The details of your emolument are as follows:</div>
      <div class="salary-lead"><strong>With effect from the date of joining: ${esc(showInPdf("joiningDate") ? form.joiningDate : "—")}</strong></div>
      <table class="salary-table">
        ${salaryRows}
        <tr class="gross"><td class="lbl">Gross Salary</td><td class="amt">– ${fmt(basic + housing + transport + other)}</td></tr>
      </table>
      ${showInPdf("visaStatus") ? `<p style="margin-top:8px;font-size:0.9rem;"><strong>${esc(getFieldLabel("visaStatus"))}:</strong> ${esc(form.visaStatus)}</p>` : ""}
    </div>
    ` : ""}
    ${termsSections.join("")}
    ${showInPdf("additionalNotes") ? `<div class="section"><p style="font-size:0.92rem;">${esc(form.additionalNotes)}</p></div>` : ""}
    <div class="doc-footer">
      <div class="doc-footer-cell"><div class="sign-label">Prepared By</div><div>${esc(schoolName)}</div></div>
      <div class="doc-footer-cell"><div class="sign-label">Checked By</div><div>&nbsp;</div></div>
      <div class="doc-footer-cell"><div class="sign-label">Authorised By</div><div>${esc(schoolName)}</div></div>
    </div>
    <div class="page-note">Page 1 of 1</div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
  };

  const handlePrint = async () => {
    if (!form.candidateName) {
      toast({ title: "Validation", description: "Candidate name is required.", variant: "destructive" });
      return;
    }
    setPrinting(true);
    try {
      const school = (await fetchApi("/SchoolProfile").catch(() => null)) as SchoolProfileDto | null;
      const html = buildOfferLetterHtml(school);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 6000);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to generate.", variant: "destructive" });
    } finally {
      setPrinting(false);
    }
  };

  const handleCreateTeacher = async () => {
    if (!form.candidateName || !form.registerNumber || !form.phone) {
      toast({ title: "Validation", description: "Name, Register Number, and Phone are required.", variant: "destructive" });
      return;
    }
    if (!form.basicSalary || parseFloat(form.basicSalary) <= 0) {
      toast({ title: "Validation", description: "Basic salary must be greater than 0.", variant: "destructive" });
      return;
    }
    if (!form.joiningDate) {
      toast({ title: "Validation", description: "Joining date is required.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const createdUser = (await fetchApi("/Users", {
        method: "POST",
        body: JSON.stringify({
          userId: form.registerNumber,
          password: form.registerNumber,
          name: form.candidateName,
          role: "teacher",
          phone: form.phone || undefined,
          subject: form.subject || undefined,
        }),
      })) as { id: string };

      await fetchApi("/TeacherSalary", {
        method: "POST",
        body: JSON.stringify({
          teacherUserId: createdUser.id,
          effectiveFrom: form.joiningDate + "T00:00:00Z",
          effectiveTo: null,
          amount: gross,
          payFrequency: "Monthly",
          currency: "INR",
          notes: `Offer letter – Gross: ₹${gross.toLocaleString("en-IN")}`,
        }),
      });

      const body = JSON.stringify({
        candidateName: form.candidateName,
        gender: form.gender,
        candidateAddress: form.candidateAddress,
        passportId: form.passportId,
        designation: form.designation,
        subject: form.subject,
        phone: form.phone,
        registerNumber: form.registerNumber,
        refNumber: form.refNumber,
        letterDate: form.letterDate || null,
        interviewDate: form.interviewDate || null,
        joiningDate: form.joiningDate || null,
        basicSalary: parseFloat(form.basicSalary) || 0,
        housingAllowance: parseFloat(form.housingAllowance) || 0,
        transportAllowance: parseFloat(form.transportAllowance) || 0,
        otherAllowances: parseFloat(form.otherAllowances) || 0,
        visaStatus: form.visaStatus,
        medical: form.medical,
        leave: form.leave,
        joiningExpenses: form.joiningExpenses,
        probationPeriod: form.probationPeriod,
        additionalNotes: form.additionalNotes,
        teacherUserId: createdUser.id,
      });
      if (editingId) {
        await fetchApi(`/TeacherOfferLetters/${editingId}`, { method: "PUT", body });
      } else {
        const created = (await fetchApi("/TeacherOfferLetters", { method: "POST", body })) as { id: string };
        setEditingId(created.id);
      }
      await loadSavedLetters();

      toast({
        title: "Teacher Created",
        description: `${form.candidateName} registered (ID: ${form.registerNumber}) with ₹${gross.toLocaleString("en-IN")}/month.`,
      });
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to create teacher.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const loadForEdit = async (id: string) => {
    try {
      const data = (await fetchApi(`/TeacherOfferLetters/${id}`)) as any;
      setForm({
        candidateName: data.candidateName || "",
        gender: data.gender || "Mr",
        candidateAddress: data.candidateAddress || "",
        passportId: data.passportId || "",
        designation: data.designation || "Teacher",
        subject: data.subject || "",
        phone: data.phone || "",
        registerNumber: data.registerNumber || "",
        letterDate: data.letterDate || new Date().toISOString().slice(0, 10),
        refNumber: data.refNumber || "",
        interviewDate: data.interviewDate || "",
        joiningDate: data.joiningDate || "",
        basicSalary: String(data.basicSalary || ""),
        housingAllowance: String(data.housingAllowance || ""),
        transportAllowance: String(data.transportAllowance || ""),
        otherAllowances: String(data.otherAllowances || ""),
        visaStatus: data.visaStatus || "",
        medical: data.medical || defaultForm.medical,
        leave: data.leave || defaultForm.leave,
        joiningExpenses: data.joiningExpenses || defaultForm.joiningExpenses,
        probationPeriod: data.probationPeriod || defaultForm.probationPeriod,
        additionalNotes: data.additionalNotes || "",
      });
      setEditingId(id);
      setActiveTab("form");
    } catch (_) {
      toast({ title: "Error", description: "Failed to load offer letter.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchApi(`/TeacherOfferLetters/${id}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Offer letter deleted." });
      if (editingId === id) {
        setEditingId(null);
        setForm(defaultForm);
      }
      await loadSavedLetters();
    } catch (_) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const startNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setActiveTab("form");
  };

  if (loadingFields) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Teacher Offer Letter" description="Loading field configurations..." />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading field configurations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DashboardHeader title="Teacher Offer Letter" description="Create, save, and print professional offer letters for teachers." />
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="gap-2" onClick={startNew}>
            <Plus className="h-4 w-4" /> New
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowResetModal(true)}>
            <RotateCcw className="h-4 w-4" /> Reset All Fields
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : editingId ? "Update" : "Save to DB"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrint} disabled={printing}>
            <Printer className="h-4 w-4" />
            {printing ? "Generating..." : "Preview & Print"}
          </Button>
          <Button className="gap-2 gradient-primary text-primary-foreground" onClick={handleCreateTeacher} disabled={creating}>
            <UserPlus className="h-4 w-4" />
            {creating ? "Creating..." : "Create Teacher Account"}
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-border pb-2">
        <button onClick={() => setActiveTab("form")} className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === "form" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
          {editingId ? "Edit Offer Letter" : "New Offer Letter"}
        </button>
        <button onClick={() => { setActiveTab("list"); loadSavedLetters(); }} className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === "list" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
          Saved Letters ({savedLetters.length})
        </button>
      </div>

      {activeTab === "list" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> Saved Offer Letters
            </CardTitle>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : savedLetters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No offer letters saved yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead className="text-right">Gross Salary</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedLetters.map((letter) => (
                    <TableRow key={letter.id}>
                      <TableCell className="font-medium">{letter.candidateName}</TableCell>
                      <TableCell>{letter.designation || "—"}</TableCell>
                      <TableCell>{letter.joiningDate || "—"}</TableCell>
                      <TableCell className="text-right">₹{Number(letter.grossSalary).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(letter.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => loadForEdit(letter.id)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(letter.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "form" && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" /> Candidate Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Gender */}
                  <div className={`space-y-1 ${!isFieldActive("gender") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["gender"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "gender")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("gender")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={!isFieldActive("gender") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("gender")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("gender") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("gender")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("gender") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("gender")}>{isFieldActive("gender") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("gender") ? 'pointer-events-none' : ''}>
                      <Select value={form.gender} onValueChange={(v: "Mr" | "Ms") => set("gender", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Mr">Mr.</SelectItem><SelectItem value="Ms">Ms.</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Candidate Name */}
                  <div className={`space-y-1 ${!isFieldActive("candidateName") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["candidateName"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "candidateName")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("candidateName")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={`after:content-['*'] after:text-destructive after:ml-0.5 ${!isFieldActive("candidateName") ? "text-muted-foreground line-through" : ""}`}>{getFieldLabel("candidateName")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("candidateName") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("candidateName")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("candidateName") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("candidateName")}>{isFieldActive("candidateName") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("candidateName") ? 'pointer-events-none' : ''}>
                      <Input value={form.candidateName} onChange={(e) => set("candidateName", e.target.value)} placeholder="Full name" />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className={`space-y-1 ${!isFieldActive("candidateAddress") ? 'opacity-40' : ''}`}>
                  {editingFieldId === fieldConfigs["candidateAddress"]?.id ? (
                    <div className="flex items-center gap-2 mb-1">
                      <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "candidateAddress")} />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("candidateAddress")}><Check className="h-4 w-4 text-green-600" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <Label className={!isFieldActive("candidateAddress") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("candidateAddress")}</Label>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isFieldActive("candidateAddress") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("candidateAddress")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                        <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("candidateAddress") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("candidateAddress")}>{isFieldActive("candidateAddress") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                      </div>
                    </div>
                  )}
                  <div className={!isFieldActive("candidateAddress") ? 'pointer-events-none' : ''}>
                    <Input value={form.candidateAddress} onChange={(e) => set("candidateAddress", e.target.value)} placeholder="City, Country" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Passport ID */}
                  <div className={`space-y-1 ${!isFieldActive("passportId") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["passportId"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "passportId")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("passportId")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={!isFieldActive("passportId") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("passportId")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("passportId") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("passportId")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("passportId") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("passportId")}>{isFieldActive("passportId") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("passportId") ? 'pointer-events-none' : ''}>
                      <Input value={form.passportId} onChange={(e) => set("passportId", e.target.value)} placeholder="Passport or ID number" />
                    </div>
                  </div>

                  {/* Register Number */}
                  <div className={`space-y-1 ${!isFieldActive("registerNumber") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["registerNumber"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "registerNumber")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("registerNumber")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={`after:content-['*'] after:text-destructive after:ml-0.5 ${!isFieldActive("registerNumber") ? "text-muted-foreground line-through" : ""}`}>{getFieldLabel("registerNumber")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("registerNumber") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("registerNumber")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("registerNumber") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("registerNumber")}>{isFieldActive("registerNumber") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("registerNumber") ? 'pointer-events-none' : ''}>
                      <Input value={form.registerNumber} onChange={(e) => set("registerNumber", e.target.value)} placeholder="e.g. TCH001" />
                    </div>
                  </div>
                </div>

                {/* Designation and Subject */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`space-y-1 ${!isFieldActive("designation") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["designation"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "designation")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("designation")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={!isFieldActive("designation") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("designation")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("designation") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("designation")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("designation") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("designation")}>{isFieldActive("designation") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("designation") ? 'pointer-events-none' : ''}>
                      <Input value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Teacher" />
                    </div>
                  </div>

                  <div className={`space-y-1 ${!isFieldActive("subject") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["subject"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "subject")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("subject")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={!isFieldActive("subject") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("subject")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("subject") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("subject")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("subject") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("subject")}>{isFieldActive("subject") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("subject") ? 'pointer-events-none' : ''}>
                      <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. Mathematics" />
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className={`space-y-1 ${!isFieldActive("phone") ? 'opacity-40' : ''}`}>
                  {editingFieldId === fieldConfigs["phone"]?.id ? (
                    <div className="flex items-center gap-2 mb-1">
                      <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "phone")} />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("phone")}><Check className="h-4 w-4 text-green-600" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <Label className={`after:content-['*'] after:text-destructive after:ml-0.5 ${!isFieldActive("phone") ? "text-muted-foreground line-through" : ""}`}>{getFieldLabel("phone")}</Label>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isFieldActive("phone") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("phone")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                        <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("phone") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("phone")}>{isFieldActive("phone") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                      </div>
                    </div>
                  )}
                  <div className={!isFieldActive("phone") ? 'pointer-events-none' : ''}>
                    <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>

                <Separator />

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`space-y-1 ${!isFieldActive("letterDate") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["letterDate"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "letterDate")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("letterDate")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={!isFieldActive("letterDate") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("letterDate")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("letterDate") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("letterDate")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("letterDate") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("letterDate")}>{isFieldActive("letterDate") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("letterDate") ? 'pointer-events-none' : ''}>
                      <Input type="date" value={form.letterDate} onChange={(e) => set("letterDate", e.target.value)} />
                    </div>
                  </div>

                  <div className={`space-y-1 ${!isFieldActive("refNumber") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["refNumber"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "refNumber")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("refNumber")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={!isFieldActive("refNumber") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("refNumber")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("refNumber") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("refNumber")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("refNumber") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("refNumber")}>{isFieldActive("refNumber") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("refNumber") ? 'pointer-events-none' : ''}>
                      <Input value={form.refNumber} onChange={(e) => set("refNumber", e.target.value)} placeholder="e.g. HR/2024/001" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`space-y-1 ${!isFieldActive("interviewDate") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["interviewDate"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "interviewDate")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("interviewDate")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={!isFieldActive("interviewDate") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("interviewDate")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("interviewDate") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("interviewDate")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("interviewDate") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("interviewDate")}>{isFieldActive("interviewDate") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("interviewDate") ? 'pointer-events-none' : ''}>
                      <Input type="date" value={form.interviewDate} onChange={(e) => set("interviewDate", e.target.value)} />
                    </div>
                  </div>

                  <div className={`space-y-1 ${!isFieldActive("joiningDate") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["joiningDate"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "joiningDate")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("joiningDate")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={`after:content-['*'] after:text-destructive after:ml-0.5 ${!isFieldActive("joiningDate") ? "text-muted-foreground line-through" : ""}`}>{getFieldLabel("joiningDate")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("joiningDate") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("joiningDate")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("joiningDate") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("joiningDate")}>{isFieldActive("joiningDate") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("joiningDate") ? 'pointer-events-none' : ''}>
                      <Input type="date" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Salary Breakdown & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Basic Salary */}
                  <div className={`space-y-1 ${!isFieldActive("basicSalary") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["basicSalary"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "basicSalary")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("basicSalary")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={`after:content-['*'] after:text-destructive after:ml-0.5 ${!isFieldActive("basicSalary") ? "text-muted-foreground line-through" : ""}`}>{getFieldLabel("basicSalary")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("basicSalary") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("basicSalary")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("basicSalary") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("basicSalary")}>{isFieldActive("basicSalary") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("basicSalary") ? 'pointer-events-none' : ''}>
                      <Input type="number" min="0" step="0.01" value={form.basicSalary} onChange={(e) => set("basicSalary", e.target.value)} placeholder="0" />
                    </div>
                  </div>

                  {/* Housing Allowance */}
                  <div className={`space-y-1 ${!isFieldActive("housingAllowance") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["housingAllowance"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "housingAllowance")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("housingAllowance")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={!isFieldActive("housingAllowance") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("housingAllowance")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("housingAllowance") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("housingAllowance")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("housingAllowance") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("housingAllowance")}>{isFieldActive("housingAllowance") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("housingAllowance") ? 'pointer-events-none' : ''}>
                      <Input type="number" min="0" step="0.01" value={form.housingAllowance} onChange={(e) => set("housingAllowance", e.target.value)} placeholder="0" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Transport Allowance */}
                  <div className={`space-y-1 ${!isFieldActive("transportAllowance") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["transportAllowance"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "transportAllowance")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("transportAllowance")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={!isFieldActive("transportAllowance") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("transportAllowance")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("transportAllowance") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("transportAllowance")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("transportAllowance") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("transportAllowance")}>{isFieldActive("transportAllowance") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("transportAllowance") ? 'pointer-events-none' : ''}>
                      <Input type="number" min="0" step="0.01" value={form.transportAllowance} onChange={(e) => set("transportAllowance", e.target.value)} placeholder="0" />
                    </div>
                  </div>

                  {/* Other Allowances */}
                  <div className={`space-y-1 ${!isFieldActive("otherAllowances") ? 'opacity-40' : ''}`}>
                    {editingFieldId === fieldConfigs["otherAllowances"]?.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "otherAllowances")} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("otherAllowances")}><Check className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <Label className={!isFieldActive("otherAllowances") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("otherAllowances")}</Label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isFieldActive("otherAllowances") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("otherAllowances")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                          <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("otherAllowances") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("otherAllowances")}>{isFieldActive("otherAllowances") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                        </div>
                      </div>
                    )}
                    <div className={!isFieldActive("otherAllowances") ? 'pointer-events-none' : ''}>
                      <Input type="number" min="0" step="0.01" value={form.otherAllowances} onChange={(e) => set("otherAllowances", e.target.value)} placeholder="0" />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">Gross Salary</span>
                  <span className="text-base font-bold text-primary">₹{gross.toLocaleString("en-IN")}</span>
                </div>

                {/* Visa Status */}
                <div className={`space-y-1 ${!isFieldActive("visaStatus") ? 'opacity-40' : ''}`}>
                  {editingFieldId === fieldConfigs["visaStatus"]?.id ? (
                    <div className="flex items-center gap-2 mb-1">
                      <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "visaStatus")} />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("visaStatus")}><Check className="h-4 w-4 text-green-600" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <Label className={!isFieldActive("visaStatus") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("visaStatus")}</Label>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isFieldActive("visaStatus") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("visaStatus")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                        <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("visaStatus") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("visaStatus")}>{isFieldActive("visaStatus") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                      </div>
                    </div>
                  )}
                  <div className={!isFieldActive("visaStatus") ? 'pointer-events-none' : ''}>
                    <Input value={form.visaStatus} onChange={(e) => set("visaStatus", e.target.value)} placeholder="e.g. Work visa provided" />
                  </div>
                </div>

                <Separator />

                {/* Medical */}
                <div className={`space-y-1 ${!isFieldActive("medical") ? 'opacity-40' : ''}`}>
                  {editingFieldId === fieldConfigs["medical"]?.id ? (
                    <div className="flex items-center gap-2 mb-1">
                      <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "medical")} />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("medical")}><Check className="h-4 w-4 text-green-600" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <Label className={!isFieldActive("medical") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("medical")}</Label>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isFieldActive("medical") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("medical")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                        <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("medical") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("medical")}>{isFieldActive("medical") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                      </div>
                    </div>
                  )}
                  <div className={!isFieldActive("medical") ? 'pointer-events-none' : ''}>
                    <Textarea rows={2} value={form.medical} onChange={(e) => set("medical", e.target.value)} />
                  </div>
                </div>

                {/* Leave */}
                <div className={`space-y-1 ${!isFieldActive("leave") ? 'opacity-40' : ''}`}>
                  {editingFieldId === fieldConfigs["leave"]?.id ? (
                    <div className="flex items-center gap-2 mb-1">
                      <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "leave")} />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("leave")}><Check className="h-4 w-4 text-green-600" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <Label className={!isFieldActive("leave") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("leave")}</Label>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isFieldActive("leave") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("leave")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                        <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("leave") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("leave")}>{isFieldActive("leave") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                      </div>
                    </div>
                  )}
                  <div className={!isFieldActive("leave") ? 'pointer-events-none' : ''}>
                    <Textarea rows={3} value={form.leave} onChange={(e) => set("leave", e.target.value)} />
                  </div>
                </div>

                {/* Joining Expenses */}
                <div className={`space-y-1 ${!isFieldActive("joiningExpenses") ? 'opacity-40' : ''}`}>
                  {editingFieldId === fieldConfigs["joiningExpenses"]?.id ? (
                    <div className="flex items-center gap-2 mb-1">
                      <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "joiningExpenses")} />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("joiningExpenses")}><Check className="h-4 w-4 text-green-600" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <Label className={!isFieldActive("joiningExpenses") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("joiningExpenses")}</Label>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isFieldActive("joiningExpenses") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("joiningExpenses")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                        <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("joiningExpenses") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("joiningExpenses")}>{isFieldActive("joiningExpenses") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                      </div>
                    </div>
                  )}
                  <div className={!isFieldActive("joiningExpenses") ? 'pointer-events-none' : ''}>
                    <Textarea rows={2} value={form.joiningExpenses} onChange={(e) => set("joiningExpenses", e.target.value)} />
                  </div>
                </div>

                {/* Probation Period */}
                <div className={`space-y-1 ${!isFieldActive("probationPeriod") ? 'opacity-40' : ''}`}>
                  {editingFieldId === fieldConfigs["probationPeriod"]?.id ? (
                    <div className="flex items-center gap-2 mb-1">
                      <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "probationPeriod")} />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("probationPeriod")}><Check className="h-4 w-4 text-green-600" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <Label className={!isFieldActive("probationPeriod") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("probationPeriod")}</Label>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isFieldActive("probationPeriod") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("probationPeriod")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                        <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("probationPeriod") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("probationPeriod")}>{isFieldActive("probationPeriod") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                      </div>
                    </div>
                  )}
                  <div className={!isFieldActive("probationPeriod") ? 'pointer-events-none' : ''}>
                    <Textarea rows={2} value={form.probationPeriod} onChange={(e) => set("probationPeriod", e.target.value)} />
                  </div>
                </div>

                {/* Additional Notes */}
                <div className={`space-y-1 ${!isFieldActive("additionalNotes") ? 'opacity-40' : ''}`}>
                  {editingFieldId === fieldConfigs["additionalNotes"]?.id ? (
                    <div className="flex items-center gap-2 mb-1">
                      <Input value={editTempLabel} onChange={(e) => setEditTempLabel(e.target.value)} className="h-7 text-sm py-0 px-2" autoFocus onKeyDown={(e) => handleKeyDown(e, "additionalNotes")} />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveLabel("additionalNotes")}><Check className="h-4 w-4 text-green-600" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <Label className={!isFieldActive("additionalNotes") ? "text-muted-foreground line-through" : ""}>{getFieldLabel("additionalNotes")}</Label>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isFieldActive("additionalNotes") && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEditingLabel("additionalNotes")}><Edit className="h-3 w-3 text-muted-foreground" /></Button>}
                        <Button size="sm" variant="ghost" className={`h-6 w-6 p-0 ${isFieldActive("additionalNotes") ? 'text-destructive' : 'text-green-600'}`} onClick={() => toggleFieldActive("additionalNotes")}>{isFieldActive("additionalNotes") ? <Trash2 className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}</Button>
                      </div>
                    </div>
                  )}
                  <div className={!isFieldActive("additionalNotes") ? 'pointer-events-none' : ''}>
                    <Textarea rows={2} value={form.additionalNotes} onChange={(e) => set("additionalNotes", e.target.value)} placeholder="Any extra clauses..." />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end gap-3 pb-4 flex-wrap">
            <Button variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : editingId ? "Update in Database" : "Save to Database"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={handlePrint} disabled={printing}>
              <Printer className="h-4 w-4" />
              {printing ? "Generating..." : "Preview & Print Offer Letter"}
            </Button>
            <Button className="gap-2 gradient-primary text-primary-foreground" onClick={handleCreateTeacher} disabled={creating}>
              <UserPlus className="h-4 w-4" />
              {creating ? "Creating..." : "Create Teacher Account from This Data"}
            </Button>
          </div>
        </>
      )}

      {/* Reset All Fields Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Fields</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all field labels to their default values and activate all fields?
              <br /><br />
              <strong>This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetModal(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                setResetting(true);
                try {
                  await fetchApi("/OfferLetterFieldConfigs/reset-to-defaults", { method: "POST" });
                  await loadFieldConfigs();
                  toast({ title: "Success", description: "All fields reset to defaults" });
                  setShowResetModal(false);
                } catch (e) {
                  toast({ title: "Error", description: "Failed to reset fields", variant: "destructive" });
                } finally {
                  setResetting(false);
                }
              }}
              disabled={resetting}
            >
              {resetting ? "Resetting..." : "Reset All Fields"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}