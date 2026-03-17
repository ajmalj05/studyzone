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
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { FileText, UserPlus, Printer, Save, Plus, Trash2, Edit } from "lucide-react";

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

const esc = (value: string | undefined | null) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function buildOfferLetterHtml(form: OfferForm, school: SchoolProfileDto | null): string {
  const schoolName = school?.name || "Studyzone Private Institute";
  const logoUrl =
    school?.logoUrl || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const basic = parseFloat(form.basicSalary) || 0;
  const housing = parseFloat(form.housingAllowance) || 0;
  const transport = parseFloat(form.transportAllowance) || 0;
  const other = parseFloat(form.otherAllowances) || 0;
  const gross = basic + housing + transport + other;

  const currency = "₹";
  const fmt = (n: number) => n > 0 ? `${currency}${n.toLocaleString("en-IN")}` : `${currency}–`;

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
      <span><strong>Ref:</strong> ${esc(form.refNumber || "—")}</span>
      <span>${esc(form.letterDate || today)}</span>
    </div>
    <div class="salutation">
      <strong>${esc(form.candidateName ? (form.gender === "Ms" ? "Ms." : "Mr.") + " " + form.candidateName : "—")}</strong><br/>
      ${esc(form.candidateAddress || "")}
    </div>
    <div class="re-line">
      <u>Re: Offer of employment – ${esc(form.gender === "Ms" ? "Ms." : "Mr.")} ${esc(form.candidateName)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; National Passport no. / ID: ${esc(form.passportId || "—")}</u>
    </div>
    <div class="intro">
      With reference to your interview dated <strong>${esc(form.interviewDate || "—")}</strong>, we are pleased to confirm our offer of employment to you for the post of <strong>${esc(form.designation || "—")}</strong> as per the terms and conditions outlined below.
    </div>
    <div class="section">
      <div class="section-title">1. Gross Salary Breakdown</div>
      <div class="salary-lead">The details of your emolument are as follows:</div>
      <div class="salary-lead"><strong>With effect from the date of joining: ${esc(form.joiningDate || "—")}</strong></div>
      <table class="salary-table">
        <tr><td class="lbl">Basic Salary</td><td class="amt">– ${fmt(basic)}</td></tr>
        <tr><td class="lbl">Housing Allowance (including utilities)</td><td class="amt">– ${fmt(housing)}</td></tr>
        <tr><td class="lbl">Transport Allowance</td><td class="amt">– ${fmt(transport)}</td></tr>
        <tr><td class="lbl">Other Allowances</td><td class="amt">– ${fmt(other)}</td></tr>
        <tr class="gross"><td class="lbl">Gross Salary</td><td class="amt">– ${fmt(gross)}</td></tr>
      </table>
      ${form.visaStatus ? `<p style="margin-top:8px;font-size:0.9rem;"><strong>Visa status:</strong> ${esc(form.visaStatus)}</p>` : ""}
    </div>
    <div class="section">
      <div class="section-title">2. Medical</div>
      <p style="font-size:0.92rem;">${esc(form.medical || "Medical insurance for yourself and family.")}</p>
    </div>
    <div class="section">
      <div class="section-title">3. Leave</div>
      <p style="font-size:0.92rem;">${esc(form.leave || "30 calendar days of paid leave after completion of 12 calendar months of work.")}</p>
    </div>
    <div class="section">
      <div class="section-title">4. Joining Expenses</div>
      <p style="font-size:0.92rem;">${esc(form.joiningExpenses || "Currently non-anticipated.")}</p>
    </div>
    <div class="section">
      <div class="section-title">5. Probation Period</div>
      <p style="font-size:0.92rem;">${esc(form.probationPeriod || "You will be on probation for a period of 6 months effective from the date of joining.")}</p>
    </div>
    ${form.additionalNotes ? `<div class="section"><p style="font-size:0.92rem;">${esc(form.additionalNotes)}</p></div>` : ""}
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
}

interface OfferForm {
  candidateName: string;
  gender: "Mr" | "Ms";
  candidateAddress: string;
  passportId: string;
  designation: string;
  subject: string;
  phone: string;
  registerNumber: string;
  letterDate: string;
  refNumber: string;
  interviewDate: string;
  joiningDate: string;
  basicSalary: string;
  housingAllowance: string;
  transportAllowance: string;
  otherAllowances: string;
  visaStatus: string;
  medical: string;
  leave: string;
  joiningExpenses: string;
  probationPeriod: string;
  additionalNotes: string;
}

const defaultForm: OfferForm = {
  candidateName: "",
  gender: "Mr",
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

function formToRequest(form: OfferForm, teacherUserId?: string) {
  return {
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
    teacherUserId: teacherUserId || null,
  };
}

export default function TeacherOfferLetter() {
  const [form, setForm] = useState<OfferForm>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedLetters, setSavedLetters] = useState<SavedOfferLetter[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");

  const set = <K extends keyof OfferForm>(key: K, value: OfferForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const gross =
    (parseFloat(form.basicSalary) || 0) +
    (parseFloat(form.housingAllowance) || 0) +
    (parseFloat(form.transportAllowance) || 0) +
    (parseFloat(form.otherAllowances) || 0);

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
    loadSavedLetters();
  }, []);

  const handleSave = async () => {
    if (!form.candidateName) {
      toast({ title: "Validation", description: "Candidate name is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify(formToRequest(form));
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

  const handlePrint = async () => {
    if (!form.candidateName) {
      toast({ title: "Validation", description: "Candidate name is required.", variant: "destructive" });
      return;
    }
    setPrinting(true);
    try {
      const school = (await fetchApi("/SchoolProfile").catch(() => null)) as SchoolProfileDto | null;
      const html = buildOfferLetterHtml(form, school);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank", "noopener,noreferrer,width=900,height=700");
      if (w) setTimeout(() => URL.revokeObjectURL(url), 6000);
      else {
        URL.revokeObjectURL(url);
        toast({ title: "Popup blocked", description: "Allow popups to print the offer letter.", variant: "destructive" });
      }
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

      // Link offer letter record to teacher user
      const body = JSON.stringify(formToRequest(form, createdUser.id));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DashboardHeader
          title="Teacher Offer Letter"
          description="Create, save, and print professional offer letters for teachers."
        />
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="gap-2" onClick={startNew}>
            <Plus className="h-4 w-4" /> New
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : editingId ? "Update" : "Save to DB"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrint} disabled={printing}>
            <Printer className="h-4 w-4" />
            {printing ? "Generating…" : "Preview & Print"}
          </Button>
          <Button className="gap-2 gradient-primary text-primary-foreground" onClick={handleCreateTeacher} disabled={creating}>
            <UserPlus className="h-4 w-4" />
            {creating ? "Creating…" : "Create Teacher Account"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("form")}
          className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === "form" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          {editingId ? "✏️ Edit Offer Letter" : "New Offer Letter"}
        </button>
        <button
          onClick={() => { setActiveTab("list"); loadSavedLetters(); }}
          className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === "list" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
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
              <p className="text-sm text-muted-foreground">Loading…</p>
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
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(letter.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => loadForEdit(letter.id)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(letter.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ─── Candidate Details ─── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Candidate Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Select value={form.gender} onValueChange={(v: "Mr" | "Ms") => set("gender", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr.</SelectItem>
                      <SelectItem value="Ms">Ms.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input value={form.candidateName} onChange={(e) => set("candidateName", e.target.value)} placeholder="Full name" />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Address / Location</Label>
                <Input value={form.candidateAddress} onChange={(e) => set("candidateAddress", e.target.value)} placeholder="City, Country" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Passport / ID No.</Label>
                  <Input value={form.passportId} onChange={(e) => set("passportId", e.target.value)} placeholder="Passport or ID number" />
                </div>
                <div className="space-y-1">
                  <Label>Register No. (Login ID) <span className="text-destructive">*</span></Label>
                  <Input value={form.registerNumber} onChange={(e) => set("registerNumber", e.target.value)} placeholder="e.g. TCH001" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Designation / Post</Label>
                  <Input value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Teacher, HOD" />
                </div>
                <div className="space-y-1">
                  <Label>Subject</Label>
                  <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. Mathematics" />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Phone <span className="text-destructive">*</span></Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Letter Date</Label>
                  <Input type="date" value={form.letterDate} onChange={(e) => set("letterDate", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Ref. Number</Label>
                  <Input value={form.refNumber} onChange={(e) => set("refNumber", e.target.value)} placeholder="e.g. HR/2024/001" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Interview Date</Label>
                  <Input type="date" value={form.interviewDate} onChange={(e) => set("interviewDate", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Date of Joining <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Salary & Terms ─── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Salary Breakdown &amp; Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Basic Salary (₹) <span className="text-destructive">*</span></Label>
                  <Input type="number" min="0" step="0.01" value={form.basicSalary} onChange={(e) => set("basicSalary", e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label>Housing Allowance (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={form.housingAllowance} onChange={(e) => set("housingAllowance", e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Transport Allowance (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={form.transportAllowance} onChange={(e) => set("transportAllowance", e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label>Other Allowances (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={form.otherAllowances} onChange={(e) => set("otherAllowances", e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Gross Salary</span>
                <span className="text-base font-bold text-primary">₹{gross.toLocaleString("en-IN")}</span>
              </div>

              <div className="space-y-1">
                <Label>Visa Status</Label>
                <Input value={form.visaStatus} onChange={(e) => set("visaStatus", e.target.value)} placeholder="e.g. Work visa provided" />
              </div>

              <Separator />

              <div className="space-y-1">
                <Label>2. Medical</Label>
                <Textarea rows={2} value={form.medical} onChange={(e) => set("medical", e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>3. Leave</Label>
                <Textarea rows={3} value={form.leave} onChange={(e) => set("leave", e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>4. Joining Expenses</Label>
                <Textarea rows={2} value={form.joiningExpenses} onChange={(e) => set("joiningExpenses", e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>5. Probation Period</Label>
                <Textarea rows={2} value={form.probationPeriod} onChange={(e) => set("probationPeriod", e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>Additional Notes (optional)</Label>
                <Textarea rows={2} value={form.additionalNotes} onChange={(e) => set("additionalNotes", e.target.value)} placeholder="Any extra clauses…" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom action bar */}
      {activeTab === "form" && (
        <div className="flex justify-end gap-3 pb-4 flex-wrap">
          <Button variant="outline" className="gap-2" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : editingId ? "Update in Database" : "Save to Database"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrint} disabled={printing}>
            <Printer className="h-4 w-4" />
            {printing ? "Generating…" : "Preview & Print Offer Letter"}
          </Button>
          <Button className="gap-2 gradient-primary text-primary-foreground" onClick={handleCreateTeacher} disabled={creating}>
            <UserPlus className="h-4 w-4" />
            {creating ? "Creating…" : "Create Teacher Account from This Data"}
          </Button>
        </div>
      )}
    </div>
  );
}
