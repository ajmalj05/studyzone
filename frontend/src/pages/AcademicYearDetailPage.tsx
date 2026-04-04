import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useAcademicYear } from "@/context/AcademicYearContext";
import { Calendar, Users, BookOpen, ArrowLeft, Search } from "lucide-react";

interface AcademicYearDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isArchived: boolean;
}

interface StudentDto {
  id: string;
  admissionNumber: string;
  name: string;
  className?: string;
  batchName?: string;
  status: string;
  guardianName?: string;
  guardianPhone?: string;
}

interface BatchDto {
  id: string;
  classId: string;
  className: string;
  name: string;
  section?: string;
  seatLimit?: number;
}

interface FeeStructureDto {
  id: string;
  classId: string;
  className: string;
  name: string;
  amount: number;
  frequency: string;
}

const FEE_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface FeeLedgerDto {
  studentId: string;
  studentName: string;
  className?: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  feePaymentStartMonth?: number;
  feePaymentStartYear?: number;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(n);
}

export default function AcademicYearDetailPage() {
  const { yearId } = useParams<{ yearId: string }>();
  const navigate = useNavigate();
  const { setSelectedYearId } = useAcademicYear();

  const [year, setYear] = useState<AcademicYearDto | null>(null);
  const [loadingYear, setLoadingYear] = useState(true);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [structures, setStructures] = useState<FeeStructureDto[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [batchSearch, setBatchSearch] = useState("");

  // Sync context so selected year = this page's year
  useEffect(() => {
    if (yearId) setSelectedYearId(yearId);
  }, [yearId, setSelectedYearId]);

  // Fetch year details
  useEffect(() => {
    if (!yearId) {
      setLoadingYear(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingYear(true);
      try {
        const data = (await fetchApi(`/AcademicYears/${yearId}`)) as AcademicYearDto | null;
        if (!cancelled && data) {
          setYear({
            ...data,
            startDate: (data.startDate as string).split("T")[0],
            endDate: (data.endDate as string).split("T")[0],
          });
        } else if (!cancelled && !data) {
          toast({ title: "Not found", description: "Academic year not found.", variant: "destructive" });
          navigate("/admin/academic-year", { replace: true });
        }
      } catch (e: unknown) {
        if (!cancelled) {
          toast({ title: "Error", description: (e as Error).message || "Failed to load academic year", variant: "destructive" });
          navigate("/admin/academic-year", { replace: true });
        }
      } finally {
        if (!cancelled) setLoadingYear(false);
      }
    })();
    return () => { cancelled = true; };
  }, [yearId, navigate]);

  // Overview: counts for this year
  useEffect(() => {
    if (!yearId) return;
    let cancelled = false;
    (async () => {
      setLoadingOverview(true);
      try {
        const [studentsRes, batchesList, structuresList] = await Promise.all([
          fetchApi(`/Students?academicYearId=${encodeURIComponent(yearId)}&take=1`) as Promise<{ items: StudentDto[]; total: number }>,
          fetchApi(`/Batches?academicYearId=${encodeURIComponent(yearId)}`) as Promise<BatchDto[]>,
          fetchApi(`/Fees/structures?academicYearId=${encodeURIComponent(yearId)}`) as Promise<FeeStructureDto[]>,
        ]);
        if (!cancelled) {
          setStudentsTotal(studentsRes?.total ?? 0);
          setBatches(Array.isArray(batchesList) ? batchesList : []);
          setStructures(Array.isArray(structuresList) ? structuresList : []);
        }
      } catch {
        if (!cancelled) {
          setStudentsTotal(0);
          setBatches([]);
          setStructures([]);
        }
      } finally {
        if (!cancelled) setLoadingOverview(false);
      }
    })();
    return () => { cancelled = true; };
  }, [yearId]);

  // Load students when Students tab is active (or on first load for overview we already have total)
  const loadStudents = async () => {
    if (!yearId) return;
    setLoadingStudents(true);
    try {
      const res = (await fetchApi(`/Students?academicYearId=${encodeURIComponent(yearId)}&take=500`)) as { items: StudentDto[]; total: number };
      setStudents(res?.items ?? []);
      setStudentsTotal(res?.total ?? 0);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load students", variant: "destructive" });
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadBatches = async () => {
    if (!yearId) return;
    setLoadingBatches(true);
    try {
      const list = (await fetchApi(`/Batches?academicYearId=${encodeURIComponent(yearId)}`)) as BatchDto[];
      setBatches(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message || "Failed to load batches", variant: "destructive" });
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.trim().toLowerCase();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.admissionNumber?.toLowerCase().includes(q) ||
        s.guardianName?.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const filteredBatches = useMemo(() => {
    if (!batchSearch.trim()) return batches;
    const q = batchSearch.trim().toLowerCase();
    return batches.filter(
      (b) =>
        b.className?.toLowerCase().includes(q) ||
        b.name?.toLowerCase().includes(q) ||
        (b.section && b.section.toLowerCase().includes(q))
    );
  }, [batches, batchSearch]);

  if (!yearId) {
    return (
      <div className="space-y-4">
        <DashboardHeader title="Academic Year" />
        <p className="text-muted-foreground">Invalid year. <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/admin/academic-year")}>Back to Academic Year</Button></p>
      </div>
    );
  }

  if (loadingYear) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">Loading academic year…</div>
    );
  }

  if (!year) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/academic-year")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      <DashboardHeader
        title={`Academic Year: ${year.name}`}
        description={`${year.startDate} – ${year.endDate}${year.isCurrent ? " (Current)" : ""}`}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview" className="gap-1"><Calendar className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="students" className="gap-1" onClick={loadStudents}><Users className="h-4 w-4" /> Students</TabsTrigger>
          <TabsTrigger value="batches" className="gap-1" onClick={loadBatches}><BookOpen className="h-4 w-4" /> Batches</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {loadingOverview ? (
            <p className="text-sm text-muted-foreground">Loading summary…</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{studentsTotal}</p>
                  <p className="text-xs text-muted-foreground">Enrolled in this year</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Batches</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{batches.length}</p>
                  <p className="text-xs text-muted-foreground">Batches in this year</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fee structures</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{structures.length}</p>
                  <p className="text-xs text-muted-foreground">Defined for this year</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>Students enrolled in this academic year. Total: {studentsTotal}. Use search to filter by name, admission number, or guardian.</CardDescription>
              <div className="flex items-center gap-2 pt-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, admission #, guardian…"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <p className="text-sm text-muted-foreground">Loading students…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admission #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Guardian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {students.length === 0 ? "No students in this year." : "No matches for your search."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.admissionNumber}</TableCell>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.className ?? "—"}</TableCell>
                          <TableCell>{s.batchName ?? "—"}</TableCell>
                          <TableCell>{s.status}</TableCell>
                          <TableCell>{s.guardianName ?? s.guardianPhone ?? "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batches</CardTitle>
              <CardDescription>Batches in this academic year. Use search to filter by class or batch name.</CardDescription>
              <div className="flex items-center gap-2 pt-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search class or batch…"
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBatches ? (
                <p className="text-sm text-muted-foreground">Loading batches…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Seat limit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          {batches.length === 0 ? "No batches in this year." : "No matches for your search."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBatches.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>{b.className}</TableCell>
                          <TableCell>{b.name}</TableCell>
                          <TableCell>{b.section ?? "—"}</TableCell>
                          <TableCell>{b.seatLimit ?? "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
