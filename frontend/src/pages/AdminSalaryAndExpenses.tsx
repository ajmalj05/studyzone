import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, CheckCircle, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const currentDate = new Date();
const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleString("en", { month: "short" });

interface TeacherSalaryPaymentLineDto {
  id: string;
  lineType: string;
  description: string;
  amount: number;
}

interface TeacherSalaryPaymentDto {
  id: string;
  teacherUserId: string;
  teacherName?: string;
  year: number;
  month: number;
  baseAmount: number;
  totalAdditions: number;
  totalDeductions: number;
  netAmount: number;
  status: string;
  paidAt?: string;
  lines: TeacherSalaryPaymentLineDto[];
}

interface TeacherDto {
  id: string;
  name: string;
  userId?: string;
}

function formatCurrency(amount: number) {
  return `AED ${Number(amount).toLocaleString("en-AE")}`;
}

export default function AdminSalaryAndExpenses() {
  const [activeTab, setActiveTab] = useState("paid");

  // Paid salaries
  const [paidYearFrom, setPaidYearFrom] = useState(currentDate.getFullYear());
  const [paidYearTo, setPaidYearTo] = useState(currentDate.getFullYear());
  const [paidPayments, setPaidPayments] = useState<TeacherSalaryPaymentDto[]>([]);
  const [paidLoading, setPaidLoading] = useState(false);

  // Teacher-wise
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
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
    if (activeTab === "paid") loadPaidSalaries();
  }, [activeTab, paidYearFrom, paidYearTo]);

  const loadTeachers = async () => {
    try {
      const data = (await fetchApi("/Users?role=teacher")) as TeacherDto[];
      setTeachers(Array.isArray(data) ? data : []);
    } catch {
      setTeachers([]);
    }
  };

  useEffect(() => {
    if (activeTab === "teacher") loadTeachers();
  }, [activeTab]);

  const loadTeacherPayments = async () => {
    if (!selectedTeacherId) {
      setTeacherPayments([]);
      return;
    }
    setTeacherPaymentsLoading(true);
    try {
      const list = (await fetchApi(`/TeacherSalary/payments/by-teacher/${selectedTeacherId}`)) as TeacherSalaryPaymentDto[];
      setTeacherPayments(Array.isArray(list) ? list : []);
    } catch {
      setTeacherPayments([]);
    }
    setTeacherPaymentsLoading(false);
  };

  useEffect(() => {
    if (selectedTeacherId) loadTeacherPayments();
    else setTeacherPayments([]);
  }, [selectedTeacherId]);

  const paidTotal = paidPayments.reduce((sum, p) => sum + p.netAmount, 0);

  return (
    <div className="space-y-6">
      <DashboardHeader title="Salary & Expenses" description="View paid salaries and teacher-wise details." />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="paid" className="gap-2">
            <CheckCircle className="h-4 w-4" /> Paid Salaries
          </TabsTrigger>
          <TabsTrigger value="teacher" className="gap-2">
            <User className="h-4 w-4" /> Teacher-wise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paid" className="space-y-4">
          <Card className="rounded-[var(--radius)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Paid teacher salaries
              </CardTitle>
              <CardDescription>Filter by year range. Only payments with status Paid are shown.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Year from</label>
                  <Select value={String(paidYearFrom)} onValueChange={(v) => setPaidYearFrom(parseInt(v, 10))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[currentDate.getFullYear(), currentDate.getFullYear() - 1, currentDate.getFullYear() - 2].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Year to</label>
                  <Select value={String(paidYearTo)} onValueChange={(v) => setPaidYearTo(parseInt(v, 10))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[currentDate.getFullYear(), currentDate.getFullYear() - 1, currentDate.getFullYear() - 2].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={loadPaidSalaries}>Refresh</Button>
              </div>
              {paidLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading…</p>
              ) : paidPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No paid salaries in the selected range.</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Teacher</TableHead>
                          <TableHead className="text-right">Period</TableHead>
                          <TableHead className="text-right">Base</TableHead>
                          <TableHead className="text-right">Additions</TableHead>
                          <TableHead className="text-right">Deductions</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                          <TableHead>Paid date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paidPayments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.teacherName ?? p.teacherUserId}</TableCell>
                            <TableCell className="text-right">{monthName(p.month)} {p.year}</TableCell>
                            <TableCell className="text-right">{formatCurrency(p.baseAmount)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(p.totalAdditions)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(p.totalDeductions)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(p.netAmount)}</TableCell>
                            <TableCell>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Total paid: {formatCurrency(paidTotal)}</p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teacher" className="space-y-4">
          <Card className="rounded-[var(--radius)]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Teacher-wise salary details
              </CardTitle>
              <CardDescription>Select a teacher to view their payment history and line-item details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium">Teacher</label>
                <Select value={selectedTeacherId || "_none"} onValueChange={(v) => setSelectedTeacherId(v === "_none" ? "" : v)}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Select teacher</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {teacherPaymentsLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading…</p>
              ) : !selectedTeacherId ? (
                <p className="text-sm text-muted-foreground py-4">Select a teacher to see payment history.</p>
              ) : teacherPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No payment records for this teacher.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">Additions</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Paid date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherPayments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{monthName(p.month)} {p.year}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.baseAmount)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(p.totalAdditions)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatCurrency(p.totalDeductions)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(p.netAmount)}</TableCell>
                          <TableCell>{p.status}</TableCell>
                          <TableCell>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => setDetailPayment(p)}>Details</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detailPayment} onOpenChange={(open) => !open && setDetailPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment details</DialogTitle>
            <DialogDescription>
              {detailPayment?.teacherName} — {detailPayment && monthName(detailPayment.month)} {detailPayment?.year}. Net: {detailPayment && formatCurrency(detailPayment.netAmount)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {detailPayment?.lines?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deductions or additions.</p>
            ) : (
              detailPayment?.lines?.map((line) => (
                <div key={line.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{line.description} ({line.lineType})</span>
                  <span className={line.lineType === "Deduction" ? "text-red-600" : "text-green-600"}>
                    {line.lineType === "Deduction" ? "-" : "+"}{formatCurrency(line.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailPayment(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
