import { useState, useEffect } from "react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Users,
  GraduationCap,
  DollarSign,
  AlertCircle,
  KeyRound,
  ChevronDown,
  ArrowUpRight,
  School,
  CheckCircle2,
  Clock,
  Calendar,
  Wallet,
  UserPlus,
  FileText,
  ClipboardCheck
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useAcademicYear } from "@/context/AcademicYearContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { RevenueChart } from "@/components/RevenueChart";
import { AttendanceChart } from "@/components/AttendanceChart";

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

const quickActions = [
  { icon: UserPlus, label: "Add Student", description: "Enroll new student", path: "/admin/students" },
  { icon: DollarSign, label: "Collect Fee", description: "Open student billing", path: "/admin/fees" },
  { icon: FileText, label: "Create Exam", description: "Schedule new exam", path: "/admin/academics/exams" },
  { icon: ClipboardCheck, label: "Mark Attendance", description: "Today's attendance", path: "/admin/attendance" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

const Index = () => {
  const navigate = useNavigate();
  const { selectedYearId } = useAcademicYear();
  usePageHeaderConfigEffect({}, []);
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

  const formatCurrency = (n: number) => `AED ${Math.abs(n).toLocaleString("en-AE")}`;

  const totalOutstanding = feeSummary.reduce((sum, f) => sum + f.outstanding, 0);
  const maxOutstanding = Math.max(...feeSummary.map(f => Math.abs(f.outstanding)), 1);

  const pipelineStages = [
    { label: "New enquiries", value: pipeline?.newEnquiries || 0, icon: Users },
    { label: "Contacted", value: pipeline?.contacted || 0, icon: CheckCircle2 },
    { label: "Interview scheduled", value: pipeline?.interviewScheduled || 0, icon: Calendar },
    { label: "Pending approvals", value: pipeline?.pendingApprovals || 0, icon: Clock },
  ];

  const maxPipelineValue = Math.max(...pipelineStages.map(s => s.value), 1);

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Stats Row */}
      <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Students" 
          value={loading ? 0 : (kpis?.totalStudents ?? 0)} 
          icon={Users} 
          loading={loading}
        />
        <StatCard 
          title="Total Teachers" 
          value={loading ? 0 : (kpis?.activeTeachers ?? 0)} 
          icon={GraduationCap} 
          loading={loading}
        />
        <StatCard 
          title="Total Revenue" 
          value={loading ? 0 : Math.round(kpis?.revenueCollected ?? 0)} 
          prefix="AED " 
          icon={DollarSign} 
          loading={loading}
        />
        <StatCard 
          title="Pending Fees" 
          value={loading ? 0 : Math.round(kpis?.pendingDues ?? 0)} 
          prefix="AED " 
          icon={AlertCircle} 
          loading={loading}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="border border-border/80 shadow-sm bg-card rounded-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 h-auto py-4 border-border/80 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Fee Summary & Admission Pipeline */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {/* Fee Summary Card */}
        <Card className="border border-border/80 shadow-sm bg-card rounded-lg">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">Fee Summary by Class</CardTitle>
                  <CardDescription className="text-xs">Outstanding dues breakdown</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Outstanding</p>
                <p className="text-lg font-semibold text-primary">{formatCurrency(totalOutstanding)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {feeSummary.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <School className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">No outstanding data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feeSummary.slice(0, 6).map((f, index) => (
                  <motion.div 
                    key={f.className || "blank"}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {f.className?.charAt(0) || "—"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{f.className || "—"}</p>
                          <p className="text-xs text-muted-foreground">{f.studentCount} students</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(f.outstanding)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(Math.abs(f.outstanding) / maxOutstanding) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            <Link to="/admin/fees" className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-border/50 text-sm font-medium text-primary hover:underline transition-all group">
              View all fees 
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Admission Pipeline Card */}
        <Card className="border border-border/80 shadow-sm bg-card rounded-lg">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Admission Pipeline</CardTitle>
                <CardDescription className="text-xs">Enquiries and approvals flow</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {pipeline && (
              <div className="space-y-4">
                {pipelineStages.map((stage, index) => {
                  const Icon = stage.icon;
                  const percentage = (stage.value / maxPipelineValue) * 100;
                  return (
                    <motion.div 
                      key={stage.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{stage.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{stage.value}</span>
                          {index > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {pipelineStages[index - 1].value > 0 
                                ? `${Math.round((stage.value / pipelineStages[index - 1].value) * 100)}%` 
                                : '0%'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            <Link to="/admin/admission" className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-border/50 text-sm font-medium text-primary hover:underline transition-all group">
              View admission 
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart academicYearId={selectedYearId || undefined} />
        </div>
        <AttendanceChart academicYearId={selectedYearId || undefined} />
      </motion.div>

      {/* Portal Logins Info */}
      <motion.div variants={itemVariants}>
        <Collapsible open={loginsOpen} onOpenChange={setLoginsOpen}>
          <Card className="border border-border/80 shadow-sm bg-card rounded-lg">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-lg pb-4">
                <CardTitle className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-muted">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                  </div>
                  How portal logins work
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform duration-300 ${loginsOpen ? "rotate-180" : ""}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="text-sm space-y-3 pt-0 pb-4">
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <span className="font-semibold">Teachers:</span>{' '}
                  <span className="text-muted-foreground">Admin creates the teacher (Teachers page) with a <strong>Register Number</strong> (used as Login ID), name, phone, subject. Initial password can be set by admin or the teacher can use <strong>Verify Profile</strong> → <strong>Setup Account</strong> to set or change it.</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <span className="font-semibold">Parents:</span>{' '}
                  <span className="text-muted-foreground">Admin creates the parent in <strong>Parent Management</strong> with <strong>Login ID</strong>, <strong>password</strong>, and name, and links students. Parents use the main <strong>Login</strong> page with role "Parent" and those credentials.</span>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>
    </motion.div>
  );
};

// Modern Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  icon: React.ElementType;
  loading: boolean;
}

function StatCard({ title, value, prefix = "", icon: Icon, loading }: StatCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="border border-border/80 shadow-sm bg-card rounded-lg p-5 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="mt-2">
            {loading ? (
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-semibold text-foreground">
                {prefix}{value.toLocaleString("en-AE")}
              </p>
            )}
          </div>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      
      {/* Bottom progress line */}
      {!loading && (
        <div className="mt-4 h-1 rounded-full bg-muted overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (value / 1000) * 100)}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      )}
    </motion.div>
  );
}

export default Index;