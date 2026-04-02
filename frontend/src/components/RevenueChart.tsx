import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchApi } from "@/lib/api";

interface FinancialReportDto {
  totalCollection: number;
  totalOutstanding: number;
  outstandingByClass?: { className: string; outstanding: number; studentCount: number }[];
}

interface RevenueChartProps {
  academicYearId?: string;
}

export function RevenueChart({ academicYearId }: RevenueChartProps) {
  const [data, setData] = useState<FinancialReportDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (academicYearId) params.set("academicYearId", academicYearId);
    const query = params.toString() ? `?${params.toString()}` : "";
    fetchApi(`/Reports/financial${query}`)
      .then((d: FinancialReportDto) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [academicYearId]);

  const chartData = (data?.outstandingByClass ?? []).slice(0, 12).map((c) => ({
    name: c.className || "—",
    outstanding: Math.round(c.outstanding),
  }));

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Financial Overview</h3>
      <p className="text-xs text-muted-foreground">Collection and outstanding by class</p>
      {loading ? (
        <div className="mt-3 h-56 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="text-muted-foreground">Collected:</span>
            <span className="font-medium">AED {Math.round(data?.totalCollection ?? 0).toLocaleString("en-AE")}</span>
            <span className="text-muted-foreground">Outstanding:</span>
            <span className="font-medium text-warning">AED {Math.round(data?.totalOutstanding ?? 0).toLocaleString("en-AE")}</span>
          </div>
          <div className="mt-3 h-56">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No class data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                    formatter={(value: number) => [`AED ${value.toLocaleString("en-AE")}`, "Outstanding"]}
                  />
                  <Bar dataKey="outstanding" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
