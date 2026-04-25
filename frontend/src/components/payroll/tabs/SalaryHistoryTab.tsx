import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { fetchApi } from "@/lib/api";
import { TeacherDto, TeacherSalaryPaymentDto, currentPayrollDate, formatPayrollCurrency, payrollMonthName } from "@/types/payroll";
import { CheckCircle, User } from "lucide-react";
import { PaymentDetailsDialog } from "@/components/payroll/modals/PaymentDetailsDialog";

export function SalaryHistoryTab() {
  const [paidYearFrom, setPaidYearFrom] = useState(currentPayrollDate.getFullYear());
  const [paidYearTo, setPaidYearTo] = useState(currentPayrollDate.getFullYear());
  const [paidPayments, setPaidPayments] = useState<TeacherSalaryPaymentDto[]>([]);
  const [paidLoading, setPaidLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [teacherPayments, setTeacherPayments] = useState<TeacherSalaryPaymentDto[]>([]);
  const [teacherPaymentsLoading, setTeacherPaymentsLoading] = useState(false);
  const [detailPayment, setDetailPayment] = useState<TeacherSalaryPaymentDto | null>(null);

  const loadPaidSalaries = async () => {
    setPaidLoading(true);
    try {
      const params = new URLSearchParams({
        status: "Paid",
        yearFrom: String(paidYearFrom),
        yearTo: String(paidYearTo),
      });
      const list = (await fetchApi(`/TeacherSalary/payments?${params}`)) as TeacherSalaryPaymentDto[];
      setPaidPayments(Array.isArray(list) ? list : []);
    } catch {
      setPaidPayments([]);
    }
    setPaidLoading(false);
  };

  useEffect(() => {
    loadPaidSalaries();
  }, [paidYearFrom, paidYearTo]);

  useEffect(() => {
    fetchApi("/Users?role=teacher")
      .then((data: unknown) => setTeachers(Array.isArray(data) ? (data as TeacherDto[]) : []))
      .catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    if (!selectedTeacherId) {
      setTeacherPayments([]);
      return;
    }
    setTeacherPaymentsLoading(true);
    fetchApi(`/TeacherSalary/payments/by-teacher/${selectedTeacherId}`)
      .then((list: unknown) => setTeacherPayments(Array.isArray(list) ? (list as TeacherSalaryPaymentDto[]) : []))
      .catch(() => setTeacherPayments([]))
      .finally(() => setTeacherPaymentsLoading(false));
  }, [selectedTeacherId]);

  const paidTotal = useMemo(
    () => paidPayments.reduce((sum, p) => sum + p.netAmount, 0),
    [paidPayments],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-[var(--radius)]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Paid salaries</CardTitle>
          <CardDescription>Paid records for a year range.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <SearchableSelect
              value={String(paidYearFrom)}
              onValueChange={(v) => setPaidYearFrom(parseInt(v, 10))}
              className="w-28"
              options={[currentPayrollDate.getFullYear(), currentPayrollDate.getFullYear() - 1, currentPayrollDate.getFullYear() - 2].map((y) => ({ value: String(y), label: `From ${y}` }))}
            />
            <SearchableSelect
              value={String(paidYearTo)}
              onValueChange={(v) => setPaidYearTo(parseInt(v, 10))}
              className="w-28"
              options={[currentPayrollDate.getFullYear(), currentPayrollDate.getFullYear() - 1, currentPayrollDate.getFullYear() - 2].map((y) => ({ value: String(y), label: `To ${y}` }))}
            />
            <Button variant="outline" size="sm" onClick={loadPaidSalaries}>Refresh</Button>
          </div>
          {paidLoading ? (
            <p className="text-sm text-muted-foreground py-2">Loading...</p>
          ) : paidPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No paid salaries in this range.</p>
          ) : (
            <>
              <div className="max-h-[360px] overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Teacher</th>
                      <th className="text-right p-2">Period</th>
                      <th className="text-right p-2">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidPayments.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 last:border-0">
                        <td className="p-2">{p.teacherName ?? p.teacherUserId}</td>
                        <td className="p-2 text-right">{payrollMonthName(p.month)} {p.year}</td>
                        <td className="p-2 text-right">{formatPayrollCurrency(p.netAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total paid: {formatPayrollCurrency(paidTotal)}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[var(--radius)]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Teacher history</CardTitle>
          <CardDescription>Teacher-wise salary payment history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchableSelect
            value={selectedTeacherId || "_none"}
            onValueChange={(v) => setSelectedTeacherId(v === "_none" ? "" : v)}
            placeholder="Select teacher"
            options={[
              { value: "_none", label: "Select teacher" },
              ...teachers.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
          {teacherPaymentsLoading ? (
            <p className="text-sm text-muted-foreground py-2">Loading...</p>
          ) : !selectedTeacherId ? (
            <p className="text-sm text-muted-foreground py-2">Select a teacher to view payment history.</p>
          ) : teacherPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No records found.</p>
          ) : (
            <div className="max-h-[360px] overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">Month</th>
                    <th className="text-right p-2">Net</th>
                    <th className="text-left p-2">Status</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {teacherPayments.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 last:border-0">
                      <td className="p-2">{payrollMonthName(p.month)} {p.year}</td>
                      <td className="p-2 text-right">{formatPayrollCurrency(p.netAmount)}</td>
                      <td className="p-2">{p.status}</td>
                      <td className="p-2 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setDetailPayment(p)}>Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentDetailsDialog
        payment={detailPayment}
        open={!!detailPayment}
        onOpenChange={(open) => !open && setDetailPayment(null)}
      />
    </div>
  );
}
