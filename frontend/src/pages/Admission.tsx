import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { useAcademicYear } from "@/context/AcademicYearContext";
import { UserPlus, Plus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

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
}

export default function Admission() {
  const navigate = useNavigate();
  const { selectedYearId } = useAcademicYear();
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationClassId, setApplicationClassId] = useState<string>("");
  const [applicationBatchId, setApplicationBatchId] = useState<string>("");
  const initialLoadDone = useRef(false);

  usePageHeaderConfigEffect(
    { title: "Admission", description: "Applications and enrollment pipeline for the selected year." },
    [],
  );

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
      const url = selectedYearId ? `/Batches?academicYearId=${encodeURIComponent(selectedYearId)}` : "/Batches";
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
  }, [applicationClassId, applicationBatchId, selectedYearId]);

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
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                Applications
              </CardTitle>
            </div>
            <div className="flex flex-wrap gap-2 items-center shrink-0">
              <SearchableSelect
                value={applicationClassId || "all"}
                onValueChange={(v) => { setApplicationClassId(v === "all" ? "" : v); setApplicationBatchId(""); }}
                placeholder="Class"
                className="w-[150px]"
                options={[
                  { value: "all", label: "All classes" },
                  ...classes.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
                ]}
              />
              <SearchableSelect
                value={applicationBatchId || "all"}
                onValueChange={(v) => setApplicationBatchId(v === "all" ? "" : v)}
                disabled={!applicationClassId}
                placeholder="Batch"
                className="w-[150px]"
                options={[
                  { value: "all", label: "All batches" },
                  ...batchesForApplicationClass.map((b) => ({ value: b.id, label: b.name })),
                ]}
              />
              <Button className="gap-1.5" onClick={() => navigate("/admin/admission/application/new")}>
                <Plus className="h-4 w-4" /> Add application
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={applications}
              columns={[
                {
                  key: "student",
                  header: "Student",
                  cell: (a) => <span className="font-semibold capitalize text-slate-700 dark:text-slate-200">{a.studentName}</span>,
                },
                {
                  key: "class",
                  header: "Class",
                  badge: (a) => a.classApplied ? { label: a.classApplied, variant: "indigo" } : null,
                },
                {
                  key: "admissionNo",
                  header: "Admission #",
                  cell: (a) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{a.admissionNumber ?? "—"}</span>,
                },
                {
                  key: "status",
                  header: "Status",
                  badge: (a) => ({
                    label: a.status,
                    variant:
                      a.status === "Pending" ? "warning" :
                      a.status === "Approved" ? "success" :
                      a.status === "Rejected" ? "destructive" : "secondary",
                  }),
                },
              ] as DataTableColumn<typeof applications[0]>[]}
              keyExtractor={(a) => a.id}
              onRowClick={(a) => navigate(`/admin/admission/application/${a.id}`)}
              emptyMessage="No applications found"
              emptyDescription="Add an application or adjust the filters"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
