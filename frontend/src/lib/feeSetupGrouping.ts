import type { StudentDto } from "@/types/fees";

export interface FeeStructureRow {
  id: string;
  name: string;
  classId: string;
  className?: string;
  amount: number;
  frequency: string;
  academicYearId?: string;
}

export type FeeSetupTab =
  | { kind: "tuition" }
  | { kind: "admission" }
  | { kind: "bus" }
  | { kind: "other"; baseLabel: string };

export interface OtherFeeTab {
  baseLabel: string;
  items: FeeStructureRow[];
}

export interface PartitionedFees {
  tuition: FeeStructureRow[];
  admission: FeeStructureRow[];
  bus: FeeStructureRow[];
  otherTabs: OtherFeeTab[];
}

export function partitionFeeStructures(structures: FeeStructureRow[]): PartitionedFees {
  const tuition: FeeStructureRow[] = [];
  const admission: FeeStructureRow[] = [];
  const bus: FeeStructureRow[] = [];
  const otherMap = new Map<string, FeeStructureRow[]>();

  for (const s of structures) {
    const nameLower = (s.name ?? "").toLowerCase().trim();
    if (nameLower === "tuition fee") {
      tuition.push(s);
    } else if (nameLower === "admission fee") {
      admission.push(s);
    } else if (nameLower.startsWith("bus fee")) {
      bus.push(s);
    } else {
      const label = s.name.trim();
      if (!otherMap.has(label)) {
        otherMap.set(label, []);
      }
      otherMap.get(label)!.push(s);
    }
  }

  const otherTabs: OtherFeeTab[] = Array.from(otherMap.entries()).map(
    ([baseLabel, items]) => ({ baseLabel, items })
  );

  return { tuition, admission, bus, otherTabs };
}

/**
 * Parses a bus fee name of the form "Bus fee - <studentName>" or
 * "Bus fee - <studentName> - <routeNote>" into its components.
 */
export function parseBusFeeDisplay(fee: FeeStructureRow): {
  studentName: string;
  routeNote: string;
} {
  const name = fee.name ?? "";
  const prefix = "Bus fee - ";
  if (!name.toLowerCase().startsWith(prefix.toLowerCase())) {
    return { studentName: name, routeNote: "" };
  }
  const remainder = name.slice(prefix.length);
  const separatorIdx = remainder.indexOf(" - ");
  if (separatorIdx === -1) {
    return { studentName: remainder, routeNote: "" };
  }
  return {
    studentName: remainder.slice(0, separatorIdx),
    routeNote: remainder.slice(separatorIdx + 3),
  };
}

/**
 * Resolves the student ID for a bus fee row by matching the parsed student
 * name against the provided student list.
 */
export function busFeeStudentIdFromName(
  fee: FeeStructureRow,
  students: StudentDto[]
): string | null {
  const { studentName } = parseBusFeeDisplay(fee);
  if (!studentName) return null;
  const nameLower = studentName.toLowerCase();
  const match = students.find((s) => s.name.toLowerCase() === nameLower);
  return match?.id ?? null;
}

export type InferredFeeKind = {
  kind: "tuition" | "admission" | "bus" | "other";
  otherBase?: string;
};

/**
 * Infers the fee kind from a fee structure row based on its name.
 */
export function inferFeeKind(fee: FeeStructureRow): InferredFeeKind {
  const nameLower = (fee.name ?? "").toLowerCase().trim();
  if (nameLower === "tuition fee") return { kind: "tuition" };
  if (nameLower === "admission fee") return { kind: "admission" };
  if (nameLower.startsWith("bus fee")) return { kind: "bus" };
  return { kind: "other", otherBase: fee.name.trim() };
}

/**
 * Returns the classIds that already have an "other" fee whose name matches
 * the given base label, optionally excluding one classId (used during editing
 * so the current row's class remains selectable).
 */
export function classIdsTakenForOtherBase(
  allStructures: FeeStructureRow[],
  base: string,
  excludeClassId?: string
): string[] {
  const baseLower = base.toLowerCase();
  return allStructures
    .filter(
      (s) =>
        (s.name ?? "").toLowerCase().trim() === baseLower &&
        s.classId !== excludeClassId
    )
    .map((s) => s.classId);
}
