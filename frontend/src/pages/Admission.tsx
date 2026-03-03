import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useAcademicYearOptional } from "@/context/AcademicYearContext";
import { UserPlus } from "lucide-react";

interface ApplicationDto {
  id: string;
  studentName: string;
  classApplied?: string;
  classId?: string;
  batchId?: string;
  status: string;
  admissionNumber?: string;
  batch?: string;
  section?: string;
  createdAt: string;
}

interface ClassDto {
  id: string;
  name: string;
  code: string;
}

interface BatchDto {
  id: string;
  classId: string;
  className: string;
  name: string;
  section?: string;
}

export default function Admission() {
  const navigate = useNavigate();
  const academicYear = useAcademicYearOptional();
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationClassId, setApplicationClassId] = useState<string>("");
  const [applicationBatchId, setApplicationBatchId] = useState<string>("");
  const initialLoadDone = useRef(false);

  const loadApplications = async () => {
    try {
      const params = new URLSearchParams();
      params.set("take", "100");
      if (applicationClassId) params.set("classId", applicationClassId);
      if (applicationBatchId) params.set("batchId", applicationBatchId);
      const res = (await fetchApi(`/AdmissionApplications?${params.toString()}`)) as {
        items: ApplicationDto[];
        total: number;
      };
      setApplications(res.items ?? []);
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to load applications",
        variant: "destructive",
      });
    }
  };

  const loadClasses = async () => {
    try {
      const list = (await fetchApi("/Classes")) as ClassDto[];
      setClasses(list);
    } catch {
      setClasses([]);
    }
  };

  const loadAllBatches = async () => {
    try {
      const yearId = academicYear?.selectedYearId;
      const url = yearId ? `/Batches?academicYearId=${encodeURIComponent(yearId)}` : "/Batches";
      const list = (await fetchApi(url)) as BatchDto[];
      setBatches(list);
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => {
    (async () => {
      if (!initialLoadDone.current) setLoading(true);
      await Promise.all([loadApplications(), loadClasses(), loadAllBatches()]);
      setLoading(false);
      initialLoadDone.current = true;
    })();
  }, [applicationClassId, applicationBatchId, academicYear?.selectedYearId]);

  const batchesForApplicationClass = applicationClassId
    ? batches.filter((b) => b.classId === applicationClassId)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardHeader title="Admission" />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Applications
            </CardTitle>
            <CardDescription>
              Create and manage admission applications. Click a row to open the full application form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Select
                value={applicationClassId || "all"}
                onValueChange={(v) => {
                  setApplicationClassId(v === "all" ? "" : v);
                  setApplicationBatchId("");
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={applicationBatchId || "all"}
                onValueChange={(v) => setApplicationBatchId(v === "all" ? "" : v)}
                disabled={!applicationClassId}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All batches</SelectItem>
                  {batchesForApplicationClass.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                      {b.section ? ` (${b.section})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => navigate("/admin/admission/application/new")}>
                Add application
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Admission #</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/admission/application/${a.id}`)}
                  >
                    <TableCell>{a.studentName}</TableCell>
                    <TableCell>{a.classApplied ?? "—"}</TableCell>
                    <TableCell>{a.admissionNumber ?? "—"}</TableCell>
                    <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
