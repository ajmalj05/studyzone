import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatCard } from "@/components/StatCard";
import { RevenueChart } from "@/components/RevenueChart";
import { AttendanceChart } from "@/components/AttendanceChart";
import { RecentActivity } from "@/components/RecentActivity";
import { QuickActions } from "@/components/QuickActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, AlertCircle, ClipboardList, TrendingUp } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { Link } from "react-router-dom";

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
  const [kpis, setKpis] = useState<KpiDto | null>(null);
  const [pipeline, setPipeline] = useState<AdmissionPipelineDto | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [k, p, f] = await Promise.all([
          fetchApi("/Dashboard/kpis") as Promise<KpiDto>,
          fetchApi("/Dashboard/admission-pipeline") as Promise<AdmissionPipelineDto>,
          fetchApi("/Dashboard/fee-summary") as Promise<FeeSummaryDto[]>,
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
  }, []);

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-4">
      <DashboardHeader />
        {/* Stat Cards - live from API */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Students" value={loading ? 0 : (kpis?.totalStudents ?? 0)} icon={Users} color="gradient-primary" />
          <StatCard title="Total Teachers" value={loading ? 0 : (kpis?.activeTeachers ?? 0)} icon={GraduationCap} color="bg-success" />
          <StatCard title="Total Revenue" value={loading ? 0 : Math.round(kpis?.revenueCollected ?? 0)} prefix="₹" icon={DollarSign} color="bg-info" />
          <StatCard title="Pending Fees" value={loading ? 0 : Math.round(kpis?.pendingDues ?? 0)} prefix="₹" icon={AlertCircle} color="bg-warning" />
        </div>

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
            <RevenueChart />
          </div>
          <AttendanceChart />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
          <QuickActions />
        </div>
    </div>
  );
};

export default Index;
