import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pencil,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { ClassDto, StudentDto, BatchDto, formatCurrency, getInitials } from "@/types/fees";
import { AddFeeModal, type AddFeeModalSavePayload, type AddFeeModalCreateDefaults } from "../modals/AddFeeModal";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAcademicYear } from "@/context/AcademicYearContext";
import {
  partitionFeeStructures,
  parseBusFeeDisplay,
  busFeeStudentIdFromName,
  type FeeStructureRow,
} from "@/lib/feeSetupGrouping";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FeeTablePaginationBar } from "../FeeTablePaginationBar";
import { feeSlicePage, feeClampPage, FEE_UI_PAGE_SIZE } from "@/lib/feeListPagination";

const ALL = "__all__";

interface FeeSetupTabProps {
  classes: ClassDto[];
  students: StudentDto[];
  batches: BatchDto[];
  mode?: "setup" | "bus";
}

export function FeeSetupTab({ classes, students, batches, mode = "setup" }: FeeSetupTabProps) {
  const { selectedYearId } = useAcademicYear();
  const [allStructures, setAllStructures] = useState<FeeStructureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<string>(mode === "bus" ? "bus" : "tuition");
  const [search, setSearch] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState<string>(ALL);
  const [classFilter, setClassFilter] = useState<string>(ALL);
  const [batchFilter, setBatchFilter] = useState<string>(ALL);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<AddFeeModalCreateDefaults | null>(null);
  const [editStructure, setEditStructure] = useState<FeeStructureRow | null>(null);
  const [busAssignOpen, setBusAssignOpen] = useState(false);
  const [busAssignClassId, setBusAssignClassId] = useState<string>(ALL);
  const [busAssignBatchId, setBusAssignBatchId] = useState<string>(ALL);
  const [busAssignSearch, setBusAssignSearch] = useState("");
  const [busAssignAmount, setBusAssignAmount] = useState("");
  const [busAssignFrequency, setBusAssignFrequency] = useState("Monthly");
  const [busAssignRouteNote, setBusAssignRouteNote] = useState("");
  const [busAssignSelectedStudentIds, setBusAssignSelectedStudentIds] = useState<string[]>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string } | null>(null);
  const [setupTablePage, setSetupTablePage] = useState(1);

  const loadFees = async () => {
    try {
      setLoading(true);
      const url = selectedYearId
        ? `/Fees/structures?academicYearId=${encodeURIComponent(selectedYearId)}`
        : "/Fees/structures";
      const structures = (await fetchApi(url)) as FeeStructureRow[];
      setAllStructures(structures ?? []);
    } catch (e) {
      console.error("Failed to load fees", e);
      setAllStructures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [selectedYearId]);

  useEffect(() => {
    if (mode === "bus") {
      setActiveTab("bus");
    } else if (activeTab === "bus") {
      setActiveTab("tuition");
    }
  }, [mode, activeTab]);

  const { tuition, admission, bus, otherTabs } = useMemo(
    () => partitionFeeStructures(allStructures),
    [allStructures]
  );

  const currentBucket = useMemo((): FeeStructureRow[] => {
    switch (activeTab) {
      case "tuition":
        return tuition;
      case "admission":
        return admission;
      case "bus":
        return bus;
      default: {
        // For other tabs, find by baseLabel
        const otherTab = otherTabs.find((t) => t.baseLabel === activeTab);
        return otherTab?.items ?? [];
      }
    }
  }, [activeTab, tuition, admission, bus, otherTabs]);

  const visibleStructures = useMemo(
    () =>
      mode === "bus"
        ? bus
        : [...tuition, ...admission, ...otherTabs.flatMap((t) => t.items)],
    [mode, bus, tuition, admission, otherTabs]
  );

  const filteredRows = useMemo(() => {
    let rows = currentBucket;
    if (frequencyFilter !== ALL) {
      rows = rows.filter((r) => r.frequency === frequencyFilter);
    }
    if (classFilter !== ALL) {
      rows = rows.filter((r) => r.classId === classFilter);
    }
    if (activeTab === "bus" && batchFilter !== ALL) {
      rows = rows.filter((r) => {
        const studentId = busFeeStudentIdFromName(r, students);
        const student = studentId ? students.find((s) => s.id === studentId) : undefined;
        return student?.batchId === batchFilter;
      });
    }
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    if (activeTab === "bus") {
      return rows.filter((r) => {
        const { studentName, routeNote } = parseBusFeeDisplay(r);
        return (
          studentName.toLowerCase().includes(q) ||
          (r.className || "").toLowerCase().includes(q) ||
          routeNote.toLowerCase().includes(q)
        );
      });
    }
    return rows.filter((r) => (r.className || "").toLowerCase().includes(q));
  }, [currentBucket, frequencyFilter, classFilter, batchFilter, students, search, activeTab]);

  useEffect(() => {
    setSetupTablePage(1);
  }, [activeTab, search, frequencyFilter, classFilter, batchFilter]);

  useEffect(() => {
    setSetupTablePage((p) => feeClampPage(p, filteredRows.length, FEE_UI_PAGE_SIZE));
  }, [filteredRows.length]);

  const pagedFilteredRows = useMemo(
    () => feeSlicePage(filteredRows, setupTablePage, FEE_UI_PAGE_SIZE),
    [filteredRows, setupTablePage]
  );

  const handleAdd = async (payload: AddFeeModalSavePayload, editingId?: string) => {
    try {
      setSaving(true);
      
      // Transform payload to match backend CreateFeeStructureRequest
      const { feeKind, name, classId, studentId, amount, frequency, routeNote } = payload;
      const student = studentId ? students.find((s) => s.id === studentId) : undefined;
      const resolvedClassId = feeKind === "bus" ? student?.classId : classId;
      
      // Determine the fee name based on type
      let feeName = name || "";
      if (feeKind === "tuition") feeName = "Tuition Fee";
      else if (feeKind === "admission") feeName = "Admission Fee";
      else if (feeKind === "bus" && student) {
        feeName = `Bus Fee - ${student.name}${routeNote ? ` - ${routeNote}` : ""}`;
      }
      // For custom ("other") fees, use the name field directly
      if (!resolvedClassId) {
        throw new Error("Class is required to save this fee.");
      }
      
      const body: {
        classId: string;
        academicYearId?: string;
        amount: number;
        frequency: string;
        name: string;
        studentId?: string;
        routeNote?: string;
      } = {
        classId: resolvedClassId,
        academicYearId: selectedYearId || undefined,
        amount,
        frequency,
        name: feeName,
      };
      
      if (studentId) {
        body.studentId = studentId;
      }
      if (routeNote) {
        body.routeNote = routeNote;
      }
      
      if (editingId) {
        await fetchApi(`/Fees/structures/${encodeURIComponent(editingId)}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await fetchApi("/Fees/structures", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      toast({ title: "Saved", description: "Fee structure saved." });
      setAddModalOpen(false);
      setCreateDefaults(null);
      setEditStructure(null);
      await loadFees();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description:
          (e as { message?: string })?.message || "Failed to save fee structure.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      setSaving(true);
      await fetchApi(`/Fees/structures/${encodeURIComponent(deleteItem.id)}`, {
        method: "DELETE",
      });
      toast({ title: "Deleted", description: "Fee structure deleted." });
      setDeleteModalOpen(false);
      setDeleteItem(null);
      await loadFees();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description:
          (e as { message?: string })?.message || "Failed to delete fee structure.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = (defaults?: AddFeeModalCreateDefaults) => {
    setEditStructure(null);
    const isOther = mode !== "bus" && !["tuition", "admission"].includes(activeTab);
    setCreateDefaults(
      defaults ?? ({
        feeKind: mode === "bus" ? "bus" : isOther ? "other" : (activeTab as "tuition" | "admission"),
        otherStructureName: isOther ? activeTab : undefined,
      } satisfies AddFeeModalCreateDefaults)
    );
    setAddModalOpen(true);
  };

  const openEditModal = (fee: FeeStructureRow) => {
    setEditStructure(fee);
    setCreateDefaults(null);
    setAddModalOpen(true);
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteModalOpen(true);
  };

  const frequencyOptions = useMemo(() => {
    const allFreqs = new Set<string>();
    visibleStructures.forEach((s) => {
      if (s.frequency) allFreqs.add(s.frequency);
    });
    return Array.from(allFreqs).sort();
  }, [visibleStructures]);

  const batchOptions = useMemo(() => {
    const scopedBatches = classFilter === ALL ? batches : batches.filter((b) => b.classId === classFilter);
    return [...scopedBatches].sort((a, b) => a.name.localeCompare(b.name));
  }, [batches, classFilter]);

  const busTakenStudentIds = useMemo(
    () =>
      bus
        .map((b) => busFeeStudentIdFromName(b, students))
        .filter(Boolean) as string[],
    [bus, students]
  );

  const busAssignBatchOptions = useMemo(() => {
    const scoped = busAssignClassId === ALL ? batches : batches.filter((b) => b.classId === busAssignClassId);
    return [...scoped].sort((a, b) => a.name.localeCompare(b.name));
  }, [batches, busAssignClassId]);

  const busAssignableStudents = useMemo(() => {
    const q = busAssignSearch.trim().toLowerCase();
    return students
      .filter((s) => !busTakenStudentIds.includes(s.id))
      .filter((s) => (busAssignClassId === ALL ? true : s.classId === busAssignClassId))
      .filter((s) => (busAssignBatchId === ALL ? true : s.batchId === busAssignBatchId))
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.admissionNumber.toLowerCase().includes(q) ||
          (s.className || "").toLowerCase().includes(q) ||
          (s.batchName || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, busTakenStudentIds, busAssignClassId, busAssignBatchId, busAssignSearch]);

  const allBusAssignableSelected =
    busAssignableStudents.length > 0 &&
    busAssignableStudents.every((s) => busAssignSelectedStudentIds.includes(s.id));

  const toggleBusStudent = (studentId: string) => {
    setBusAssignSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const toggleSelectAllBusStudents = () => {
    if (allBusAssignableSelected) {
      const visibleIds = new Set(busAssignableStudents.map((s) => s.id));
      setBusAssignSelectedStudentIds((prev) => prev.filter((id) => !visibleIds.has(id)));
      return;
    }
    setBusAssignSelectedStudentIds((prev) => {
      const next = new Set(prev);
      busAssignableStudents.forEach((s) => next.add(s.id));
      return Array.from(next);
    });
  };

  const openBusAssignDialog = () => {
    setBusAssignClassId(ALL);
    setBusAssignBatchId(ALL);
    setBusAssignSearch("");
    setBusAssignAmount("");
    setBusAssignFrequency("Monthly");
    setBusAssignRouteNote("");
    setBusAssignSelectedStudentIds([]);
    setBusAssignOpen(true);
  };

  const handleBusBulkAssign = async () => {
    const amount = Number(busAssignAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast({ title: "Validation", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }
    if (busAssignSelectedStudentIds.length === 0) {
      toast({ title: "Validation", description: "Select at least one student.", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      for (const studentId of busAssignSelectedStudentIds) {
        const student = students.find((s) => s.id === studentId);
        if (!student?.classId) continue;
        await fetchApi("/Fees/structures", {
          method: "POST",
          body: JSON.stringify({
            classId: student.classId,
            academicYearId: selectedYearId || undefined,
            amount,
            frequency: busAssignFrequency,
            name: `Bus Fee - ${student.name}${busAssignRouteNote.trim() ? ` - ${busAssignRouteNote.trim()}` : ""}`,
            studentId,
            routeNote: busAssignRouteNote.trim() || undefined,
          }),
        });
      }
      toast({
        title: "Saved",
        description: `Bus fee assigned to ${busAssignSelectedStudentIds.length} student${busAssignSelectedStudentIds.length > 1 ? "s" : ""}.`,
      });
      setBusAssignOpen(false);
      await loadFees();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as { message?: string })?.message || "Failed to assign bus fee.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getColumns = (): DataTableColumn<FeeStructureRow>[] => {
    if (activeTab === "bus") {
      return [
        {
          key: "student",
          header: "Student",
          cell: (fee) => {
            const { studentName } = parseBusFeeDisplay(fee);
            return (
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                  {getInitials(studentName)}
                </span>
                <span className="font-medium text-slate-700 text-sm">{studentName}</span>
              </div>
            );
          },
        },
        {
          key: "className",
          header: "Class",
          cell: (fee) => <span className="text-slate-600 text-sm">{fee.className ?? "—"}</span>,
        },
        {
          key: "amount",
          header: "Amount (AED)",
          cell: (fee) => <span className="text-slate-600 text-sm">{formatCurrency(fee.amount)}</span>,
          align: "right",
        },
        {
          key: "routeNote",
          header: "Route / note",
          cell: (fee) => {
            const { routeNote } = parseBusFeeDisplay(fee);
            return <span className="text-slate-600 text-sm">{routeNote || "—"}</span>;
          },
        },
        {
          key: "frequency",
          header: "Frequency",
          cell: (fee) => (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {fee.frequency}
            </span>
          ),
        },
        {
          key: "actions",
          header: "",
          align: "right",
          cell: (fee) => (
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEditModal(fee)} disabled={saving}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => {
                  const { studentName } = parseBusFeeDisplay(fee);
                  confirmDelete(fee.id, `${studentName} — ${formatCurrency(fee.amount)}`);
                }} disabled={saving}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ];
      } else if (activeTab === "admission") {
        return [
          {
            key: "className",
            header: "Class",
            cell: (fee) => <span className="text-slate-600 text-sm">{fee.className ?? "—"}</span>,
          },
          {
            key: "amount",
            header: "Amount (AED)",
            cell: (fee) => <span className="text-slate-600 text-sm">{formatCurrency(fee.amount)}</span>,
            align: "right",
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (fee) => (
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEditModal(fee)} disabled={saving}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => confirmDelete(fee.id, `${fee.className ?? "—"} — ${formatCurrency(fee.amount)}`)} disabled={saving}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ];
      } else {
        // Tuition and Other
        return [
          {
            key: "className",
            header: "Class",
            cell: (fee) => <span className="text-slate-600 text-sm">{fee.className ?? "—"}</span>,
          },
          {
            key: "frequency",
            header: "Frequency",
            cell: (fee) => (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {fee.frequency}
              </span>
            ),
          },
          {
            key: "amount",
            header: "Amount (AED)",
            cell: (fee) => <span className="text-slate-600 text-sm">{formatCurrency(fee.amount)}</span>,
            align: "right",
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (fee) => (
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEditModal(fee)} disabled={saving}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => confirmDelete(fee.id, `${fee.className ?? "—"} — ${formatCurrency(fee.amount)}`)} disabled={saving}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ];
      }
  };

  return (
    <Card>

      <CardContent className="space-y-4">
        {/* Row 1: Title/Desc, Filters, Add Button */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">{mode === "bus" ? "Bus fees" : "Fee setup"}</h3>
            <p className="text-sm text-slate-500">
              {mode === "bus"
                ? "Manage student-wise bus fee amounts and routes."
                : "Manage tuition, admission and other fee structures."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mode === "setup" && (
              <SearchableSelect
                value={activeTab}
                onValueChange={setActiveTab}
                placeholder="Select fee type"
                className="w-[160px]"
                options={[
                  { value: "tuition", label: "Tuition" },
                  { value: "admission", label: "Admission" },
                  ...otherTabs
                    .filter((t) => t.baseLabel && t.baseLabel.trim() !== "")
                    .map((t) => ({ value: t.baseLabel, label: t.baseLabel })),
                ]}
              />
            )}
            <SearchableSelect
              value={frequencyFilter}
              onValueChange={setFrequencyFilter}
              placeholder="Frequency"
              className="w-[140px]"
              options={[
                { value: ALL, label: "All frequencies" },
                ...frequencyOptions.map((f) => ({ value: f, label: f })),
              ]}
            />
            <SearchableSelect
              value={classFilter}
              onValueChange={(value) => {
                setClassFilter(value);
                if (mode === "bus") setBatchFilter(ALL);
              }}
              placeholder="Class"
              className="w-[140px]"
              options={[
                { value: ALL, label: "All classes" },
                ...classes.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            {mode === "bus" && (
              <SearchableSelect
                value={batchFilter}
                onValueChange={setBatchFilter}
                placeholder="Batch"
                className="w-[140px]"
                options={[
                  { value: ALL, label: "All batches" },
                  ...batchOptions.map((b) => ({ value: b.id, label: b.name })),
                ]}
              />
            )}
            <Button
              onClick={() => (mode === "bus" ? openBusAssignDialog() : openAddModal())}
              className="gap-2"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add fee
            </Button>
          </div>
        </div>

        
      <div className="p-4 space-y-4 rounded-lg border border-slate-200">
        <DataTable
          data={pagedFilteredRows}
          columns={getColumns()}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyMessage={activeTab === "bus" ? "No bus fees to show" : activeTab === "admission" ? "No admission fees to show" : activeTab === "tuition" ? "No tuition fees to show" : "No fees to show"}
          emptyDescription={activeTab === "bus" ? "Add bus fees to get started" : "Add fee structures to get started"}
        />

            <FeeTablePaginationBar
              page={setupTablePage}
              total={filteredRows.length}
              onPageChange={setSetupTablePage}
            />
          </div>

      </CardContent>

      <AddFeeModal
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) {
            setEditStructure(null);
            setCreateDefaults(null);
          }
        }}
        onSave={handleAdd}
        editStructure={editStructure}
        createDefaults={createDefaults}
        classes={classes}
        students={students}
        batches={batches}
        tuitionTakenClassIds={tuition.map(t => t.classId).filter(Boolean) as string[]}
        admissionTakenClassIds={admission.map(a => a.classId).filter(Boolean) as string[]}
        busTakenStudentIds={bus
          .map((b) => busFeeStudentIdFromName(b, students))
          .filter(Boolean) as string[]}
        allStructures={allStructures}
        saving={saving}
      />

      <Dialog open={busAssignOpen} onOpenChange={setBusAssignOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Assign bus fee (bulk)</DialogTitle>
            <DialogDescription>
              Select students and apply one fee amount/frequency in a single action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-1">
                <SearchableSelect
                  value={busAssignClassId}
                  onValueChange={(value) => {
                    setBusAssignClassId(value);
                    setBusAssignBatchId(ALL);
                  }}
                  placeholder="All classes"
                  options={[
                    { value: ALL, label: "All classes" },
                    ...classes.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>
              <div className="sm:col-span-1">
                <SearchableSelect
                  value={busAssignBatchId}
                  onValueChange={setBusAssignBatchId}
                  placeholder="All batches"
                  options={[
                    { value: ALL, label: "All batches" },
                    ...busAssignBatchOptions.map((b) => ({ value: b.id, label: b.name })),
                  ]}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  value={busAssignSearch}
                  onChange={(e) => setBusAssignSearch(e.target.value)}
                  placeholder="Search by student name, admission no, class or batch"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={busAssignAmount}
                onChange={(e) => setBusAssignAmount(e.target.value)}
                placeholder="Amount (AED)"
              />
              <SearchableSelect
                value={busAssignFrequency}
                onValueChange={setBusAssignFrequency}
                options={[
                  { value: "Monthly", label: "Monthly" },
                  { value: "Per term", label: "Per term" },
                  { value: "Annual", label: "Annual" },
                  { value: "Once", label: "Once" },
                ]}
              />
              <Input
                value={busAssignRouteNote}
                onChange={(e) => setBusAssignRouteNote(e.target.value)}
                placeholder="Route / note (optional)"
              />
            </div>

            <div className="rounded-md border border-slate-200">
              <div className="flex items-center justify-between border-b bg-slate-50 px-3 py-2 text-sm">
                <button
                  type="button"
                  onClick={toggleSelectAllBusStudents}
                  className="font-medium text-[hsl(193,76%,36%)] hover:underline"
                >
                  {allBusAssignableSelected ? "Clear selection" : "Select all visible"}
                </button>
                <span className="text-slate-500">
                  {busAssignSelectedStudentIds.length} selected / {busAssignableStudents.length} visible
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {busAssignableStudents.length === 0 ? (
                  <p className="p-3 text-sm text-slate-500">No students available for bus fee assignment.</p>
                ) : (
                  <div className="space-y-1">
                    {busAssignableStudents.map((s) => (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={busAssignSelectedStudentIds.includes(s.id)}
                            onChange={() => toggleBusStudent(s.id)}
                            className="h-4 w-4 rounded border-slate-300 accent-[hsl(193,76%,36%)]"
                          />
                          <span className="text-sm font-medium text-slate-700">{s.name}</span>
                          <span className="text-xs text-slate-500">({s.admissionNumber})</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {s.className || "—"} {s.batchName ? `• ${s.batchName}` : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBusAssignOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleBusBulkAssign} disabled={saving}>
              {saving ? "Saving…" : "Assign fee to selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete fee structure"
        description={deleteItem ? `Are you sure you want to delete ${deleteItem.name}? This action cannot be undone.` : "Are you sure you want to delete this fee structure?"}
      />
    </Card>
  );
}

export function BusFeesTab(props: Omit<FeeSetupTabProps, "mode">) {
  return <FeeSetupTab {...props} mode="bus" />;
}