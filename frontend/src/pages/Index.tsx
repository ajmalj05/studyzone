import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatCard } from "@/components/StatCard";
import { RevenueChart } from "@/components/RevenueChart";
import { AttendanceChart } from "@/components/AttendanceChart";
import { RecentActivity } from "@/components/RecentActivity";
import { QuickActions } from "@/components/QuickActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, GraduationCap, DollarSign, AlertCircle, ClipboardList, TrendingUp, KeyRound, ChevronDown } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { Link } from "react-router-dom";
import { useAcademicYear } from "@/context/AcademicYearContext";
import { CurrentAcademicYearBadge } from "@/components/CurrentAcademicYearBadge";

interface KpiDto {
  totalStudents: number;
  activeTeachers: number;
  staffCount: number;
  revenueCollected: number;
  pendingDues: number;
}

interface AdmissionPipelineDto {
  newEnquiries: number;
  contacted: number;
  interviewScheduled: number;
  pendingApprovals: number;
}

interface FeeSummaryDto {
  className: string;
  outstanding: number;
  studentCount: number;
}

const Index = () => {
  const { selectedYearId } = useAcademicYear();
  const [kpis, setKpis] = useState<KpiDto | null>(null);
  const [pipeline, setPipeline] = useState<AdmissionPipelineDto | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginsOpen, setLoginsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const yearParam = selectedYearId ? `?academicYearId=${encodeURIComponent(selectedYearId)}` : "";
        const [k, p, f] = await Promise.all([
          fetchApi(`/Dashboard/kpis${yearParam}`) as Promise<KpiDto>,
          fetchApi("/Dashboard/admission-pipeline") as Promise<AdmissionPipelineDto>,
          fetchApi(`/Dashboard/fee-summary${yearParam}`) as Promise<FeeSummaryDto[]>,
        ]);
        setKpis(k);
        setPipeline(p);
        setFeeSummary(f ?? []);
      } catch (_) {
        setKpis({ totalStudents: 0, activeTeachers: 0, staffCount: 0, revenueCollected: 0, pendingDues: 0 });
        setPipeline({ newEnquiries: 0, contacted: 0, interviewScheduled: 0, pendingApprovals: 0 });
      }
      setLoading(false);
    })();
  }, [selectedYearId]);

  const formatCurrency = (n: number) => `AED ${n.toLocaleString("en-AE")}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DashboardHeader />
        <CurrentAcademicYearBadge />
      </div>
        {/* Stat Cards - live from API */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Students" value={loading ? 0 : (kpis?.totalStudents ?? 0)} icon={Users} color="gradient-primary" />
          <StatCard title="Total Teachers" value={loading ? 0 : (kpis?.activeTeachers ?? 0)} icon={GraduationCap} color="bg-success" />
          <StatCard title="Total Revenue" value={loading ? 0 : Math.round(kpis?.revenueCollected ?? 0)} prefix="AED " icon={DollarSign} color="bg-info" />
          <StatCard title="Pending Fees" value={loading ? 0 : Math.round(kpis?.pendingDues ?? 0)} prefix="AED " icon={AlertCircle} color="bg-warning" />
        </div>

        {/* Quick Actions - prominent above charts */}
        <QuickActions />

        {/* How portal logins work - collapsible, easy to find */}
        <Collapsible open={loginsOpen} onOpenChange={setLoginsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  How portal logins work
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform duration-200 ${loginsOpen ? "rotate-180" : ""}`} />
                </CardTitle>
                <CardDescription>How teachers and parents get and use their logins</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="text-sm space-y-3 pt-0">
                <div>
                  <span className="font-medium text-foreground">Teachers:</span> Admin creates the teacher (Teachers page) with a <strong>Register Number</strong> (used as Login ID), name, phone, subject. Initial password can be set by admin or the teacher can use <strong>Verify Profile</strong> → <strong>Setup Account</strong> to set or change it.
                </div>
                <div>
                  <span className="font-medium text-foreground">Parents:</span> Admin creates the parent in <strong>Parent Management</strong> with <strong>Login ID</strong>, <strong>password</strong>, and name, and links students. Parents use the main <strong>Login</strong> page with role &quot;Parent&quot; and those credentials.
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Fee Summary & Admission Pipeline */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Fee summary by class</CardTitle>
              <CardDescription>Outstanding dues</CardDescription>
            </CardHeader>
            <CardContent>
              {feeSummary.length === 0 ? (
                <p className="text-muted-foreground text-sm">No outstanding data.</p>
              ) : (
                <ul className="space-y-2">
                  {feeSummary.slice(0, 8).map((f) => (
                    <li key={f.className || "blank"} className="flex justify-between text-sm">
                      <span>{f.className || "—"} ({f.studentCount})</span>
                      <span className="font-medium">{formatCurrency(f.outstanding)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/admin/fees" className="text-sm text-primary hover:underline mt-2 inline-block">View fees →</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Admission pipeline</CardTitle>
              <CardDescription>Enquiries and approvals</CardDescription>
            </CardHeader>
            <CardContent>
              {pipeline && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>New enquiries</div><div className="font-medium">{pipeline.newEnquiries}</div>
                  <div>Contacted</div><div className="font-medium">{pipeline.contacted}</div>
                  <div>Interview scheduled</div><div className="font-medium">{pipeline.interviewScheduled}</div>
                  <div>Pending approvals</div><div className="font-medium text-warning">{pipeline.pendingApprovals}</div>
                </div>
              )}
              <Link to="/admin/admission" className="text-sm text-primary hover:underline mt-2 inline-block">View admission →</Link>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Activity */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart academicYearId={selectedYearId || undefined} />
          </div>
          <AttendanceChart academicYearId={selectedYearId || undefined} />
        </div>

        <RecentActivity />
    </div>
  );
};

export default Index;
