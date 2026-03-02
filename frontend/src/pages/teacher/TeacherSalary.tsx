import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, History } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface TeacherSalaryDto {
  id: string;
  teacherUserId: string;
  teacherName?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  amount: number;
  payFrequency: string;
  currency: string;
  notes?: string;
  createdAt: string;
}

interface TeacherSalaryPaymentDto {
  id: string;
  year: number;
  month: number;
  baseAmount: number;
  totalAdditions: number;
  totalDeductions: number;
  netAmount: number;
  status: string;
  paidAt?: string;
}

const TeacherSalary = () => {
  const { user } = useAuth();
  const [data, setData] = useState<TeacherSalaryDto | null>(null);
  const [payments, setPayments] = useState<TeacherSalaryPaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/TeacherSalary/me")
      .then((d: TeacherSalaryDto) => setData(d))
      .catch((e: Error) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?._id) {
      setPaymentsLoading(false);
      return;
    }
    fetchApi(`/TeacherSalary/payments/by-teacher/${user._id}`)
      .then((list: TeacherSalaryPaymentDto[]) => setPayments(Array.isArray(list) ? list : []))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
  }, [user?._id]);

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "INR") return `₹${Number(amount).toLocaleString("en-IN")}`;
    return `${currency} ${Number(amount).toLocaleString()}`;
  };
  const formatPayrollCurrency = (amount: number) => `₹${Number(amount).toLocaleString("en-IN")}`;
  const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleString("en", { month: "short" });

  return (
    <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Salary Summary</h1>

        {loading && (
          <Card className="rounded-[var(--radius)] shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent>
          </Card>
        )}

        {error && (
          <Card className="rounded-[var(--radius)] border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        {!loading && !error && !data && (
          <Card className="rounded-[var(--radius)] shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              No salary record found. Contact admin.
            </CardContent>
          </Card>
        )}

        {!loading && !error && data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-[var(--radius)] shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" /> Current Salary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="rounded-xl bg-muted/50 px-6 py-4 min-w-[180px]">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</p>
                    <p className="text-lg font-semibold text-foreground mt-1">
                      {formatCurrency(data.amount, data.currency)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 px-6 py-4 min-w-[120px]">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frequency</p>
                    <p className="text-lg font-medium text-foreground mt-1">{data.payFrequency}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 px-6 py-4 min-w-[120px]">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Effective from</p>
                    <p className="text-lg font-medium text-foreground mt-1">
                      {new Date(data.effectiveFrom).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {data.notes && (
                  <p className="text-sm text-muted-foreground border-t pt-4">{data.notes}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-[var(--radius)] shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Payment history
              </CardTitle>
              <p className="text-sm text-muted-foreground">Monthly payroll summary (base, additions, deductions, net).</p>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading…</p>
              ) : payments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No payment records yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-medium">Month</th>
                        <th className="text-right p-2 font-medium">Base</th>
                        <th className="text-right p-2 font-medium">Additions</th>
                        <th className="text-right p-2 font-medium">Deductions</th>
                        <th className="text-right p-2 font-medium">Net</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-left p-2 font-medium">Paid date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-border/50 last:border-0">
                          <td className="p-2 font-medium">{monthName(p.month)} {p.year}</td>
                          <td className="p-2 text-right">{formatPayrollCurrency(p.baseAmount)}</td>
                          <td className="p-2 text-right text-green-600">{formatPayrollCurrency(p.totalAdditions)}</td>
                          <td className="p-2 text-right text-red-600">{formatPayrollCurrency(p.totalDeductions)}</td>
                          <td className="p-2 text-right font-medium">{formatPayrollCurrency(p.netAmount)}</td>
                          <td className="p-2">{p.status}</td>
                          <td className="p-2">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
    </div>
  );
};

export default TeacherSalary;
