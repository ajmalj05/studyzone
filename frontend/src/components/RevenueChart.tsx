import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Wallet, Users } from "lucide-react";
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

  const chartData = (data?.outstandingByClass ?? []).slice(0, 10).map((c) => ({
    name: c.className || "—",
    outstanding: Math.round(c.outstanding),
    studentCount: c.studentCount,
  }));

  const formatCurrency = (value: number) => `AED ${Math.abs(value).toLocaleString("en-AE")}`;

  const totalCollected = Math.round(data?.totalCollection ?? 0);
  const totalOutstanding = Math.round(data?.totalOutstanding ?? 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border border-border/80 shadow-sm bg-card rounded-lg h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold">Financial Overview</h3>
            <p className="text-xs text-muted-foreground">Collection and outstanding by class</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Collected:</span>{' '}
            {loading ? (
              <span className="inline-block w-16 h-4 bg-muted rounded animate-pulse" />
            ) : (
              <span className="font-semibold">{formatCurrency(totalCollected)}</span>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Outstanding:</span>{' '}
            {loading ? (
              <span className="inline-block w-16 h-4 bg-muted rounded animate-pulse" />
            ) : (
              <span className="font-semibold text-primary">{formatCurrency(totalOutstanding)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-5">
        {loading ? (
          <div className="h-56 flex items-center justify-center">
            <div className="space-y-4 w-full">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-40 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">No financial data available</p>
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e5e7eb" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={chartData.length > 6 ? -45 : 0}
                  textAnchor={chartData.length > 6 ? "end" : "middle"}
                  height={chartData.length > 6 ? 60 : 30}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Outstanding"]}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                />
                <Bar 
                  dataKey="outstanding" 
                  fill="hsl(189 95% 43%)" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}