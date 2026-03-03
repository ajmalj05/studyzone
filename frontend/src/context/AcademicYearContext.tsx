import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";

export interface AcademicYearOption {
  id: string;
  name: string;
}

interface AcademicYearContextType {
  currentYear: AcademicYearOption | null;
  selectedYearId: string;
  setSelectedYearId: (id: string) => void;
  academicYears: AcademicYearOption[];
  loading: boolean;
  refetch: () => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: React.ReactNode }) {
  const [currentYear, setCurrentYear] = useState<AcademicYearOption | null>(null);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [current, list] = await Promise.all([
        fetchApi("/AcademicYears/current").catch(() => null) as Promise<{ id: string; name: string } | null>,
        fetchApi("/AcademicYears?includeArchived=true").catch(() => []) as Promise<{ id: string; name: string }[]>,
      ]);
      const years = Array.isArray(list) ? list : [];
      setAcademicYears(years);
      if (current?.id) {
        setCurrentYear({ id: current.id, name: current.name });
        setSelectedYearId((prev) => (prev ? prev : current.id));
      } else if (years.length > 0) {
        setCurrentYear(years[0]);
        setSelectedYearId((prev) => (prev ? prev : years[0].id));
      } else {
        setCurrentYear(null);
        setSelectedYearId("");
      }
    } catch {
      setCurrentYear(null);
      setAcademicYears([]);
      setSelectedYearId("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const effectiveYearId = selectedYearId || currentYear?.id || "";

  const value: AcademicYearContextType = {
    currentYear,
    selectedYearId: effectiveYearId,
    setSelectedYearId,
    academicYears,
    loading,
    refetch: load,
  };

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error("useAcademicYear must be used within AcademicYearProvider");
  }
  return context;
}

export function useAcademicYearOptional(): AcademicYearContextType | undefined {
  return useContext(AcademicYearContext);
}
