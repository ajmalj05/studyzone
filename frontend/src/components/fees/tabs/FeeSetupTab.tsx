import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pencil,
  Trash2,
  Plus,
  BookOpen,
  GraduationCap,
  Bus,
  Loader2,
  Settings,
  Layers,
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
  type FeeSetupTab,
} from "@/lib/feeSetupGrouping";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FeeTablePaginationBar } from "../FeeTablePaginationBar";
import { feeSlicePage, feeClampPage, FEE_UI_PAGE_SIZE } from "@/lib/feeListPagination";

const ALL = "__all__";

interface FeeSetupTabProps {
  classes: ClassDto[];
  students: StudentDto[];
  batches: BatchDto[];
}

function tabEquals(a: FeeSetupTab, b: FeeSetupTab): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "other" && b.kind === "other") return a.baseLabel === b.baseLabel;
  return true;
}

export function FeeSetupTab({ classes, students, batches }: FeeSetupTabProps) {
  const { selectedYearId } = useAcademicYear();
  const [allStructures, setAllStructures] = useState<FeeStructureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [setupTab, setSetupTab] = useState<FeeSetupTab>({ kind: "tuition" });
  const [search, setSearch] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState<string>(ALL);
  const [classFilter, setClassFilter] = useState<string>(ALL);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<AddFeeModalCreateDefaults | null>(null);
  const [editStructure, setEditStructure] = useState<FeeStructureRow | null>(null);

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

  const { tuition, admission, bus, otherTabs } = useMemo(
    () => partitionFeeStructures(allStructures),
    [allStructures]
  );

  const currentBucket = useMemo((): FeeStructureRow[] => {
    switch (setupTab.kind) {
      case "tuition":
        return tuition;
      case "admission":
        return admission;
      case "bus":
        return bus;
      case "other":
        return otherTabs.find((t) => t.baseLabel === setupTab.baseLabel)?.items ?? [];
      default:
        return [];
    }
  }, [setupTab, tuition, admission, bus, otherTabs]);

  const filteredRows = useMemo(() => {
    let rows = currentBucket;
    if (frequencyFilter !== ALL) {
      rows = rows.filter((r) => r.frequency === frequencyFilter);
    }
    if (classFilter !== ALL) {
      rows = rows.filter((r) => r.classId === classFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    if (setupTab.kind === "bus") {
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
  }, [currentBucket, frequencyFilter, classFilter, search, setupTab.kind]);

  useEffect(() => {
    setSetupTablePage(1);
  }, [setupTab, search, frequencyFilter, classFilter]);

  useEffect(() => {
    setSetupTablePage((p) => feeClampPage(p, filteredRows.length, FEE_UI_PAGE_SIZE));
  }, [filteredRows.length]);

  const pagedFilteredRows = useMemo(
    () => feeSlicePage(filteredRows, setupTablePage, FEE_UI_PAGE_SIZE),
    [filteredRows, setupTablePage]
  );

  const frequencyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of currentBucket) {
      if (r.frequency) set.add(r.frequency);
    }
    return Array.from(set).sort();
  }, [currentBucket]);

  const tuitionTakenClassIds = useMemo(
    () => tuition.map((f) => f.classId),
    [tuition]
  );
  const admissionTakenClassIds = useMemo(
    () => admission.map((f) => f.classId),
    [admission]
  );
  const busTakenStudentIds = useMemo(
    () =>
      bus
        .map((f) => busFeeStudentIdFromName(f, students))
        .filter((x): x is string => !!x),
    [bus, students]
  );

  const openAddModal = () => {
    setEditStructure(null);
    if (setupTab.kind === "tuition") setCreateDefaults({ feeKind: "tuition" });
    else if (setupTab.kind === "admission") setCreateDefaults({ feeKind: "admission" });
    else if (setupTab.kind === "bus") setCreateDefaults({ feeKind: "bus" });
    else setCreateDefaults({ feeKind: "other", otherStructureName: setupTab.baseLabel });
    setAddModalOpen(true);
  };

  const openEditModal = (row: FeeStructureRow) => {
    setCreateDefaults(null);
    setEditStructure(row);
    setAddModalOpen(true);
  };

  const handleAddFeeSave = async (payload: AddFeeModalSavePayload, editingId?: string) => {
    try {
      setSaving(true);
      if (editingId && editStructure) {
        if (payload.feeKind === "bus") {
          const student = students.find((s) => s.id === payload.studentId);
          const studentName = student?.name || "Student";
          const routePart = payload.routeNote ? ` - ${payload.routeNote}` : "";
          await fetchApi(`/Fees/structures/${editingId}`, {
            method: "PUT",
            body: JSON.stringify({
              name: `Bus fee - ${studentName}${routePart}`,
              amount: payload.amount,
              frequency: payload.frequency,
            }),
          });
        } else {
          let nameForPut = editStructure.name;
          if (payload.feeKind === "tuition") nameForPut = "Tuition fee";
          if (payload.feeKind === "admission") nameForPut = "Admission fee";
          await fetchApi(`/Fees/structures/${editingId}`, {
            method: "PUT",
            body: JSON.stringify({
              name: nameForPut,
              amount: payload.amount,
              frequency: payload.frequency,
            }),
          });
        }
        toast({ title: "Success", description: "Fee updated successfully" });
      } else {
        if (payload.feeKind === "tuition") {
          await fetchApi("/Fees/structures", {
            method: "POST",
            body: JSON.stringify({
              classId: payload.classId,
              amount: payload.amount,
              frequency: payload.frequency,
              name: "Tuition fee",
              academicYearId: selectedYearId,
            }),
          });
        } else if (payload.feeKind === "admission") {
          await fetchApi("/Fees/structures", {
            method: "POST",
            body: JSON.stringify({
              classId: payload.classId,
              amount: payload.amount,
              frequency: "Once",
              name: "Admission fee",
              academicYearId: selectedYearId,
            }),
          });
        } else if (payload.feeKind === "bus") {
          const student = students.find((s) => s.id === payload.studentId);
          if (!student) {
            toast({ title: "Error", description: "Student not found", variant: "destructive" });
            return;
          }
          const routePart = payload.routeNote ? ` - ${payload.routeNote}` : "";
          const feeName = `Bus fee - ${student.name}${routePart}`;
          await fetchApi("/Fees/structures", {
            method: "POST",
            body: JSON.stringify({
              classId: student.classId,
              amount: payload.amount,
              frequency: payload.frequency,
              name: feeName,
              academicYearId: selectedYearId,
            }),
          });
        } else {
          const name = (payload.customStructureName || "").trim();
          await fetchApi("/Fees/structures", {
            method: "POST",
            body: JSON.stringify({
              classId: payload.classId,
              amount: payload.amount,
              frequency: payload.frequency,
              name,
              academicYearId: selectedYearId,
            }),
          });
        }
        toast({ title: "Success", description: "Fee saved successfully" });
      }
      setAddModalOpen(false);
      setEditStructure(null);
      setCreateDefaults(null);
      await loadFees();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to save fee",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      setSaving(true);
      await fetchApi(`/Fees/structures/${deleteItem.id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Fee deleted successfully" });
      await loadFees();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: (e as Error).message || "Failed to delete fee",
        variant: "destructive",
      });
    } finally {
      setDeleteModalOpen(false);
      setDeleteItem(null);
      setSaving(false);
    }
  };

  const tabDefs: { tab: FeeSetupTab; label: string; count: number; icon: typeof BookOpen }[] = [
    { tab: { kind: "tuition" }, label: "Tuition", count: tuition.length, icon: BookOpen },
    { tab: { kind: "admission" }, label: "Admission", count: admission.length, icon: GraduationCap },
    { tab: { kind: "bus" }, label: "Bus fee", count: bus.length, icon: Bus },
    ...otherTabs.map((ot) => ({
      tab: { kind: "other" as const, baseLabel: ot.baseLabel },
      label: ot.baseLabel,
      count: ot.items.length,
      icon: Layers,
    })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-white sm:flex-row sm:items-start sm:justify-between sm:space-y-0 pb-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Fee Setup</CardTitle>
              <CardDescription className="text-sm text-slate-500 mt-1">
                Manage tuition, admission, bus and other fee types for all students.
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={openAddModal}
            disabled={saving}
            className="h-9 shrink-0 bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add fee
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-b border-slate-100 px-2 pt-2 overflow-x-auto">
            <nav className="flex gap-1 min-w-max pb-0">
              {tabDefs.map(({ tab, label, count, icon: Icon }) => {
                const active = tabEquals(setupTab, tab);
                return (
                  <button
                    key={
                      tab.kind === "other"
                        ? `other-${tab.baseLabel}`
                        : tab.kind
                    }
                    type="button"
                    onClick={() => {
                      setSetupTab(tab);
                      setSearch("");
                      setFrequencyFilter(ALL);
                      setClassFilter(ALL);
                    }}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors rounded-t-md",
                      active
                        ? "text-[hsl(194,70%,27%)] bg-white"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                    <span
                      className={cn(
                        "min-w-[1.25rem] rounded-full px-1.5 py-0 text-xs font-semibold tabular-nums",
                        active
                          ? "bg-[hsl(194,70%,27%)]/10 text-[hsl(194,70%,27%)]"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {count}
                    </span>
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[hsl(194,70%,27%)]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Input
                  placeholder={
                    setupTab.kind === "bus" ? "Search student…" : "Search class…"
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 max-w-xs bg-white"
                />
                <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All frequencies</SelectItem>
                    {frequencyOptions.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {setupTab.kind === "bus" && (
                <p className="text-xs text-slate-500 shrink-0">Assigned per student individually</p>
              )}
            </div>

            {setupTab.kind === "bus" ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Student
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Class
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Amount (AED)
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Route / note
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Frequency
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-sm text-slate-400">
                        No bus fees to show.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedFilteredRows.map((fee) => {
                      const { studentName, routeNote } = parseBusFeeDisplay(fee);
                      return (
                        <TableRow key={fee.id} className="border-b border-slate-100">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                                {getInitials(studentName)}
                              </span>
                              <span className="font-medium text-slate-700">{studentName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">{fee.className ?? "—"}</TableCell>
                          <TableCell className="text-slate-600">{formatCurrency(fee.amount)}</TableCell>
                          <TableCell className="text-slate-600">{routeNote || "—"}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {fee.frequency}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-slate-700"
                                onClick={() => openEditModal(fee)}
                                disabled={saving}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-red-600"
                                onClick={() =>
                                  confirmDelete(fee.id, `${studentName} — ${formatCurrency(fee.amount)}`)
                                }
                                disabled={saving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            ) : setupTab.kind === "admission" ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Class
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Amount (AED)
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-sm text-slate-400">
                        No admission fees to show.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedFilteredRows.map((fee) => (
                      <TableRow key={fee.id} className="border-b border-slate-100">
                        <TableCell className="font-medium text-slate-700">{fee.className}</TableCell>
                        <TableCell className="text-slate-600">{formatCurrency(fee.amount)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-slate-700"
                              onClick={() => openEditModal(fee)}
                              disabled={saving}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-red-600"
                              onClick={() =>
                                confirmDelete(fee.id, `${fee.className} — ${formatCurrency(fee.amount)}`)
                              }
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Class
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Amount (AED)
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Frequency
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-sm text-slate-400">
                        No fees to show.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedFilteredRows.map((fee) => (
                      <TableRow key={fee.id} className="border-b border-slate-100">
                        <TableCell className="font-medium text-slate-700">{fee.className}</TableCell>
                        <TableCell className="text-slate-600">{formatCurrency(fee.amount)}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {fee.frequency}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-slate-700"
                              onClick={() => openEditModal(fee)}
                              disabled={saving}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-red-600"
                              onClick={() =>
                                confirmDelete(fee.id, `${fee.className} — ${formatCurrency(fee.amount)}`)
                              }
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
            <FeeTablePaginationBar
              page={setupTablePage}
              total={filteredRows.length}
              onPageChange={setSetupTablePage}
            />
          </div>
        </CardContent>
      </Card>

      <AddFeeModal
        open={addModalOpen}
        onOpenChange={(o) => {
          setAddModalOpen(o);
          if (!o) {
            setEditStructure(null);
            setCreateDefaults(null);
          }
        }}
        onSave={handleAddFeeSave}
        classes={classes}
        students={students}
        batches={batches}
        saving={saving}
        editStructure={editStructure}
        createDefaults={createDefaults}
        tuitionTakenClassIds={tuitionTakenClassIds}
        admissionTakenClassIds={admissionTakenClassIds}
        busTakenStudentIds={busTakenStudentIds}
        allStructures={allStructures}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteItem(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete fee structure"
        description="Are you sure you want to delete this fee? This action cannot be undone."
        itemName={deleteItem?.name}
        saving={saving}
      />
    </div>
  );
}
