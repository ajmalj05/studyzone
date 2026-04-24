import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { fetchApi } from "@/lib/api";

export type TeacherAssignedBatchRow = {
  id: string;
  name: string;
  classId: string;
  className: string;
  isClassTeacher: boolean;
  subjectsTaught: string[];
};

type State = "loading" | "ready" | "missing";

const TeacherCurrentBatchContext = createContext<TeacherAssignedBatchRow | null>(null);

export function useTeacherCurrentBatch(): TeacherAssignedBatchRow {
  const ctx = useContext(TeacherCurrentBatchContext);
  if (!ctx) {
    throw new Error("useTeacherCurrentBatch must be used within TeacherCurrentBatchProvider");
  }
  return ctx;
}

export function TeacherCurrentBatchProvider({
  batchId,
  children,
}: {
  batchId: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<State>("loading");
  const [batch, setBatch] = useState<TeacherAssignedBatchRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    fetchApi("/TeacherPortal/assigned-batches")
      .then((list) => {
        if (cancelled) return;
        const rows = Array.isArray(list) ? (list as TeacherAssignedBatchRow[]) : [];
        const row = rows.find((b) => b.id === batchId) ?? null;
        setBatch(row);
        setState(row ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) {
          setBatch(null);
          setState("missing");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground text-sm">Loading class…</div>
    );
  }

  if (state === "missing" || !batch) {
    return <Navigate to="/teacher/classes" replace />;
  }

  return (
    <TeacherCurrentBatchContext.Provider value={batch}>{children}</TeacherCurrentBatchContext.Provider>
  );
}

export function batchDisplayName(b: Pick<TeacherAssignedBatchRow, "className" | "name">): string {
  return `${b.className} – ${b.name}`;
}
