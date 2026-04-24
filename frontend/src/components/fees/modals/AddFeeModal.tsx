import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { ClassDto, StudentDto, BatchDto } from "@/types/fees";
import type { FeeStructureRow } from "@/lib/feeSetupGrouping";
import { inferFeeKind, parseBusFeeDisplay, classIdsTakenForOtherBase } from "@/lib/feeSetupGrouping";

export type AddFeeModalFeeKind = "tuition" | "admission" | "bus" | "other";

export interface AddFeeModalSavePayload {
  feeKind: AddFeeModalFeeKind;
  /** Fee name (used for custom/other fee types) - backend expects 'name' field */
  name?: string;
  classId?: string;
  studentId?: string;
  amount: number;
  frequency: string;
  routeNote?: string;
}

export interface AddFeeModalCreateDefaults {
  feeKind: AddFeeModalFeeKind;
  /** When opening from an "other" tab, pre-fill this name. */
  otherStructureName?: string;
}

interface AddFeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: AddFeeModalSavePayload, editingId?: string) => void;
  classes: ClassDto[];
  students: StudentDto[];
  batches: BatchDto[];
  saving?: boolean;
  /** When set, modal is in edit mode. */
  editStructure: FeeStructureRow | null;
  /** Used when opening for create (ignored if editStructure is set). */
  createDefaults: AddFeeModalCreateDefaults | null;
  tuitionTakenClassIds: string[];
  admissionTakenClassIds: string[];
  busTakenStudentIds: string[];
  allStructures: FeeStructureRow[];
}

const ALL = "__all__";

export function AddFeeModal({
  open,
  onOpenChange,
  onSave,
  classes,
  students,
  batches,
  saving,
  editStructure,
  createDefaults,
  tuitionTakenClassIds,
  admissionTakenClassIds,
  busTakenStudentIds,
  allStructures,
}: AddFeeModalProps) {
  const isEditing = !!editStructure;

  const [feeKind, setFeeKind] = useState<AddFeeModalFeeKind>("tuition");
  const [customName, setCustomName] = useState("");
  const [classFilterBatchId, setClassFilterBatchId] = useState<string>(ALL);
  const [classId, setClassId] = useState("");
  const [busBatchId, setBusBatchId] = useState<string>(ALL);
  const [busClassId, setBusClassId] = useState<string>(ALL);
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [routeNote, setRouteNote] = useState("");

  const classIdsForBatchFilter = useMemo(() => {
    if (classFilterBatchId === ALL) return null;
    const b = batches.find((x) => x.id === classFilterBatchId);
    return b ? new Set([b.classId]) : null;
  }, [batches, classFilterBatchId]);

  const classesForClassWide = useMemo(() => {
    if (!classIdsForBatchFilter) return classes;
    return classes.filter((c) => classIdsForBatchFilter.has(c.id));
  }, [classes, classIdsForBatchFilter]);

  /** Pick class before batch: all classes that have at least one student. */
  const busClasses = useMemo(() => {
    const ids = new Set(students.map((s) => s.classId));
    return classes.filter((c) => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, classes]);

  /** Batches for the selected class, or all batches if no class filter. */
  const busBatchesForClass = useMemo(() => {
    if (busClassId === ALL) return [...batches].sort((a, b) => a.name.localeCompare(b.name));
    return batches.filter((b) => b.classId === busClassId).sort((a, b) => a.name.localeCompare(b.name));
  }, [batches, busClassId]);

  const busStudents = useMemo(() => {
    return students.filter((s) => {
      if (busClassId !== ALL && s.classId !== busClassId) return false;
      if (busBatchId !== ALL && s.batchId !== busBatchId) return false;
      return true;
    });
  }, [students, busClassId, busBatchId]);

  const busStudentsSelectable = useMemo(
    () => busStudents.filter((s) => !busTakenStudentIds.includes(s.id)),
    [busStudents, busTakenStudentIds]
  );

  const otherTakenClassIds = useMemo(() => {
    if (feeKind !== "other") return [];
    const base =
      isEditing && editStructure
        ? inferFeeKind(editStructure).otherBase ||
          (editStructure.name || "").split(" - ")[0]?.trim() ||
          ""
        : customName.trim();
    return classIdsTakenForOtherBase(
      allStructures,
      base,
      isEditing ? editStructure?.classId : undefined
    );
  }, [feeKind, isEditing, editStructure, customName, allStructures]);

  const availableClassesTuition = useMemo(
    () =>
      isEditing
        ? classesForClassWide
        : classesForClassWide.filter((c) => !tuitionTakenClassIds.includes(c.id)),
    [isEditing, classesForClassWide, tuitionTakenClassIds]
  );

  const availableClassesAdmission = useMemo(
    () =>
      isEditing
        ? classesForClassWide
        : classesForClassWide.filter((c) => !admissionTakenClassIds.includes(c.id)),
    [isEditing, classesForClassWide, admissionTakenClassIds]
  );

  const availableClassesOther = useMemo(
    () =>
      isEditing
        ? classesForClassWide
        : classesForClassWide.filter((c) => !otherTakenClassIds.includes(c.id)),
    [isEditing, classesForClassWide, otherTakenClassIds]
  );

  const classListForFeeKind = useMemo((): ClassDto[] => {
    if (feeKind === "tuition") return availableClassesTuition;
    if (feeKind === "admission") return availableClassesAdmission;
    return availableClassesOther;
  }, [feeKind, availableClassesTuition, availableClassesAdmission, availableClassesOther]);

  useEffect(() => {
    if (!open) return;

    if (editStructure) {
      const inferred = inferFeeKind(editStructure);
      setFeeKind(inferred.kind);
      setCustomName(inferred.otherBase || "");
      setClassId(editStructure.classId || "");
      setAmount(String(editStructure.amount ?? ""));
      setFrequency(editStructure.frequency || "Monthly");
      if (inferred.kind === "bus") {
        const { routeNote: r, studentName } = parseBusFeeDisplay(editStructure);
        setRouteNote(r);
        const st = students.find((s) => s.name === studentName);
        setStudentId(st?.id || "");
        setBusClassId(st?.classId || ALL);
        setBusBatchId(st?.batchId || ALL);
      } else {
        setRouteNote("");
        setStudentId("");
        setBusBatchId(ALL);
        setBusClassId(ALL);
      }
      setClassFilterBatchId(ALL);
      return;
    }

    const def = createDefaults;
    const k = def?.feeKind ?? "tuition";
    setFeeKind(k);
    setCustomName(k === "other" ? (def?.otherStructureName ?? "") : "");
    setClassFilterBatchId(ALL);
    setClassId("");
    setBusBatchId(ALL);
    setBusClassId(ALL);
    setStudentId("");
    setAmount("");
    setRouteNote("");
    setFrequency(k === "admission" ? "Once" : "Monthly");
  }, [open, editStructure, createDefaults, students]);

  const title = isEditing
    ? feeKind === "bus"
      ? "Edit bus fee"
      : feeKind === "tuition"
        ? "Edit tuition fee"
        : feeKind === "admission"
          ? "Edit admission fee"
          : "Edit fee"
    : feeKind === "bus"
      ? "Assign bus fee"
      : "Add fee";

  const description = "Configure fee amount, type and frequency.";

  const emptyClassListMessage =
    feeKind === "tuition"
      ? "You are up to date — every class already has a tuition fee for this year."
      : feeKind === "admission"
        ? "You are up to date — every class already has an admission fee."
        : feeKind === "other"
          ? classFilterBatchId !== ALL
            ? "This fee is already set for the class in this batch, or try another batch."
            : "You are up to date — this fee is already added for all classes."
          : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) return;

    const payload: AddFeeModalSavePayload = {
      feeKind,
      amount: num,
      frequency: feeKind === "admission" ? "Once" : frequency,
    };

    if (feeKind === "tuition" || feeKind === "admission") {
      payload.classId = classId;
    } else if (feeKind === "other") {
      payload.name = customName.trim();
      payload.classId = classId;
    } else if (feeKind === "bus") {
      payload.studentId = studentId;
      payload.routeNote = routeNote.trim() || undefined;
    }

    if (feeKind === "other" && !payload.name) return;
    if ((feeKind === "tuition" || feeKind === "admission" || feeKind === "other") && !payload.classId) return;
    if (feeKind === "bus" && !payload.studentId) return;

    onSave(payload, editStructure?.id);
  };

  const feeTypeSelectDisabled = isEditing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900">{title}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fee type</Label>
              <SearchableSelect
                value={feeKind}
                onValueChange={(v) => {
                  const nk = v as AddFeeModalFeeKind;
                  setFeeKind(nk);
                  if (nk === "admission") setFrequency("Once");
                  if (nk !== "bus") {
                    setStudentId("");
                    setBusBatchId(ALL);
                    setBusClassId(ALL);
                  } else {
                    setBusBatchId(ALL);
                    setBusClassId(ALL);
                    setStudentId("");
                  }
                  if (nk !== "other") setCustomName("");
                }}
                disabled={feeTypeSelectDisabled}
                options={[
                  { value: "tuition", label: "Tuition fee" },
                  { value: "admission", label: "Admission fee" },
                  { value: "bus", label: "Bus fee" },
                  { value: "other", label: "Other (custom)" },
                ]}
              />
            </div>

            {feeKind === "other" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Fee name <span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-10"
                  placeholder="e.g. Exam fee, Activity fee"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={isEditing}
                  required
                />
                {!customName.trim() && (
                  <p className="text-xs text-red-500">Fee name is required</p>
                )}
              </div>
            )}

            {feeKind === "bus" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Class</Label>
                  <SearchableSelect
                    value={busClassId}
                    onValueChange={(v) => {
                      setBusClassId(v);
                      setBusBatchId(ALL);
                      setStudentId("");
                    }}
                    disabled={isEditing}
                    placeholder="All classes"
                    options={[
                      { value: ALL, label: "All classes" },
                      ...busClasses.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Batch</Label>
                  <SearchableSelect
                    value={busBatchId}
                    onValueChange={(v) => {
                      setBusBatchId(v);
                      setStudentId("");
                    }}
                    disabled={isEditing}
                    placeholder="All batches"
                    options={[
                      { value: ALL, label: "All batches" },
                      ...busBatchesForClass.map((b) => ({ value: b.id, label: b.name })),
                    ]}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Student</Label>
                  {isEditing ? (
                    <div className="h-10 px-3 flex items-center text-sm border rounded-md bg-slate-50 text-slate-600">
                      {students.find((s) => s.id === studentId)
                        ? `${students.find((s) => s.id === studentId)!.name} (${students.find((s) => s.id === studentId)!.admissionNumber})`
                        : "—"}
                    </div>
                  ) : (
                    <SearchableSelect
                      value={studentId}
                      onValueChange={setStudentId}
                      placeholder="Select student"
                      options={busStudentsSelectable.map((s) => ({
                        value: s.id,
                        label: `${s.name} (${s.admissionNumber})`,
                      }))}
                    />
                  )}
                </div>
              </>
            )}

            {(feeKind === "tuition" || feeKind === "admission" || feeKind === "other") && (
              <>
                {!isEditing && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Class</Label>
                      <SearchableSelect
                        value={classId}
                        onValueChange={setClassId}
                        placeholder="Select class"
                        options={classListForFeeKind.map((c) => ({ value: c.id, label: c.name }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Batch (filter classes)
                      </Label>
                      <SearchableSelect
                        value={classFilterBatchId}
                        onValueChange={(v) => {
                          setClassFilterBatchId(v);
                          if (v === ALL) return;
                          if (!classId) return;
                          const b = batches.find((x) => x.id === v);
                          if (!b || b.classId !== classId) setClassId("");
                        }}
                        placeholder="All batches"
                        options={[
                          { value: ALL, label: "All batches" },
                          ...batches.map((b) => ({ value: b.id, label: b.name })),
                        ]}
                      />
                    </div>
                  </>
                )}
                {isEditing && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Class</Label>
                    <div className="h-10 px-3 flex items-center text-sm border rounded-md bg-slate-50 text-slate-600">
                      {classes.find((c) => c.id === classId)?.name ?? "—"}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className={feeKind === "admission" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Amount (AED)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="h-10"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {feeKind !== "admission" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Frequency</Label>
                <SearchableSelect
                  value={frequency}
                  onValueChange={setFrequency}
                  options={[
                    "Monthly",
                    "Per term",
                    "Annual",
                    ...(feeKind === "other" ? (["Once", "HalfYearly"] as const) : []),
                    ...(frequency &&
                    !["Monthly", "Per term", "Annual", "Once", "HalfYearly"].includes(frequency)
                      ? [frequency]
                      : []),
                  ].map((f) => ({ value: f, label: f }))}
                />
              </div>
            )}

            {feeKind === "bus" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Note / route (optional)
                </Label>
                <Input
                  className="h-10"
                  placeholder="e.g. Route A, North campus…"
                  value={routeNote}
                  onChange={(e) => setRouteNote(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-4 mt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-9 bg-[hsl(189,95%,43%)] hover:bg-[hsl(193,76%,36%)]"
            >
              {saving ? "Saving…" : isEditing ? "Update fee" : "Save fee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}