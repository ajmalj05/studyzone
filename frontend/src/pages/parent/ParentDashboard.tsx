import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Users, DollarSign, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchApi } from "@/lib/api";

interface ParentChildDto {
  studentId: string;
  name: string;
  admissionNumber?: string;
  className?: string;
  batchName?: string;
  section?: string;
}

interface ParentDashboardDto {
  parentName?: string;
  children: ParentChildDto[];
  totalChildren: number;
  totalPendingFees?: number;
  recentNotices: { id: string; title: string; body?: string; createdAt: string }[];
}

const ParentDashboard = () => {
  const [data, setData] = useState<ParentDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/ParentPortal/dashboard")
      .then((d) => setData(d as ParentDashboardDto))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const name = data?.parentName ?? "Parent";
  const totalPending = Math.round(data?.totalPendingFees ?? 0);
  const childrenCount = data?.totalChildren ?? 0;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-hero rounded-[var(--radius)] p-8 text-primary-foreground"
      >
        <h2 className="text-lg font-semibold">Welcome, {name}</h2>
        <p className="mt-1 text-primary-foreground/80">Overview of your linked children</p>
      </motion.div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="animate-pulse"><CardContent className="p-6 h-24" /></Card>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Linked Children" value={childrenCount} icon={Users} color="gradient-primary" delay={0.1} />
            <StatCard title="Total Pending Fees" value={totalPending} prefix="AED " icon={DollarSign} color="bg-warning" delay={0.15} />
            <StatCard title="Announcements" value={data?.recentNotices?.length ?? 0} icon={Bell} color="bg-info" delay={0.2} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-[var(--radius)] shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">My Children</CardTitle>
                <Link to="/parent/children" className="text-sm text-primary hover:underline">View all</Link>
              </CardHeader>
              <CardContent>
                {data?.children?.length ? (
                  <ul className="space-y-3">
                    {data.children.slice(0, 5).map((c) => (
                      <li key={c.studentId} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-sm text-muted-foreground">{c.className ?? "—"} {c.section ?? ""}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No children linked. Contact the school to link your account.</p>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[var(--radius)] shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Announcements</CardTitle>
                <Link to="/parent/announcements" className="text-sm text-primary hover:underline">View all</Link>
              </CardHeader>
              <CardContent>
                {data?.recentNotices?.length ? (
                  <ul className="space-y-2">
                    {data.recentNotices.slice(0, 5).map((n) => (
                      <li key={n.id} className="text-sm">
                        <span className="font-medium">{n.title}</span>
                        <span className="text-muted-foreground ml-2">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No announcements.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentDashboard;
