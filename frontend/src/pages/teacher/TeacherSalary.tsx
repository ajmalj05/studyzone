import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { fetchApi } from "@/lib/api";

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

const TeacherSalary = () => {
  const [data, setData] = useState<TeacherSalaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/TeacherSalary/me")
      .then((d: TeacherSalaryDto) => setData(d))
      .catch((e: Error) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "INR") return `₹${Number(amount).toLocaleString("en-IN")}`;
    return `${currency} ${Number(amount).toLocaleString()}`;
  };

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
    </div>
  );
};

export default TeacherSalary;
