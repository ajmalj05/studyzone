import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatCard } from "@/components/StatCard";
import { CheckCircle, Clock, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { getStudentMenu } from "@/config/studentMenu";

interface DashboardDto {
  student: { id: string; name: string; className?: string } | null;
  attendancePercent: number | null;
  pendingFees: number;
  upcomingExamsCount: number;
}

const StudentDashboard = () => {
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [charges, setCharges] = useState<{ period: string; amount: number }[]>([]);
  const [payments, setPayments] = useState<{ amount: number; paidAt: string; receiptNumber: string }[]>([]);
  const [notices, setNotices] = useState<{ title: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dash, fees, noticesRes] = await Promise.all([
          fetchApi("/Portal/dashboard") as Promise<DashboardDto>,
          fetchApi("/Portal/fees").catch(() => null) as Promise<{ charges?: { period: string; amount: number }[]; payments?: { amount: number; paidAt: string; receiptNumber: string }[] } | null>,
          fetchApi("/Portal/notices?take=10").catch(() => []) as Promise<{ title: string; createdAt: string }[]>,
        ]);
        setDashboard(dash);
        if (fees) {
          setCharges(fees.charges ?? []);
          setPayments(fees.payments ?? []);
        }
        setNotices(Array.isArray(noticesRes) ? noticesRes : []);
      } catch (_) {
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const name = dashboard?.student?.name ?? "Student";
  const attendanceVal = dashboard?.attendancePercent != null ? Math.round(dashboard.attendancePercent) : 0;
  const pendingVal = Math.round(dashboard?.pendingFees ?? 0);
  const upcomingVal = dashboard?.upcomingExamsCount ?? 0;
  const feeRows = charges.length > 0
    ? charges.map((c) => ({ period: c.period, amount: `₹${c.amount.toLocaleString()}`, status: "Pending" as const }))
    : payments.length > 0
      ? payments.slice(0, 5).map((p) => ({ period: new Date(p.paidAt).toLocaleDateString(), amount: `₹${p.amount.toLocaleString()}`, status: "Paid" as const }))
      : [{ period: "—", amount: "—", status: "No data" as const }];

  return (
    <div className="space-y-4">
        <DashboardHeader />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="gradient-hero rounded-[var(--radius)] p-8 text-primary-foreground">
          <h2 className="text-lg font-semibold">Welcome back, {name}!</h2>
          <p className="mt-1 text-primary-foreground/80">Here's your academic overview</p>
        </motion.div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card className="animate-pulse"><CardContent className="p-6 h-24" /></Card></div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Attendance" value={attendanceVal} suffix="%" icon={ClipboardCheck} color="gradient-primary" delay={0.2} />
              <StatCard title="Pending Fees" value={pendingVal} prefix="₹" icon={DollarSign} color="bg-warning" delay={0.25} />
              <StatCard title="Enrolled" value={dashboard?.student?.className ? 1 : 0} icon={BookOpen} color="bg-info" delay={0.3} />
              <StatCard title="Upcoming Exams" value={upcomingVal} icon={Calendar} color="bg-destructive" delay={0.35} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="rounded-[var(--radius)] shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Fee Payment Status</CardTitle>
                    <Button size="sm" className="gradient-primary text-primary-foreground rounded-xl" asChild>
                      <Link to="/student/fees"><Download className="mr-2 h-4 w-4" /> View Ledger</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {feeRows.map((fee, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{fee.period}</p>
                            <p className="text-xs text-muted-foreground">{fee.amount}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${fee.status === "Paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                            {fee.status === "Paid" ? <CheckCircle className="inline mr-1 h-3 w-3" /> : <Clock className="inline mr-1 h-3 w-3" />}
                            {fee.status}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card className="rounded-[var(--radius)] shadow-card h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No notices at the moment.</p>
                  ) : (
                    notices.map((n, i) => (
                      <div key={i} className="rounded-xl border border-border p-3">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
    </div>
  );
};

export default StudentDashboard;
