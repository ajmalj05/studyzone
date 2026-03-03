import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

export interface MyBatchDto {
  id: string;
  classId: string;
  className: string;
  name: string;
  section?: string;
  seatLimit?: number;
  classTeacherUserId?: string;
  classTeacherName?: string;
}

interface TeacherBatchContextType {
  myBatch: MyBatchDto | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const TeacherBatchContext = createContext<TeacherBatchContextType | undefined>(undefined);

export function TeacherBatchProvider({ children }: { children: React.ReactNode }) {
  const [myBatch, setMyBatch] = useState<MyBatchDto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMyBatch = async () => {
    setLoading(true);
    try {
      const batch = (await fetchApi("/Batches/my-batch")) as MyBatchDto;
      setMyBatch(batch);
    } catch {
      setMyBatch(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBatch();
  }, []);

  return (
    <TeacherBatchContext.Provider value={{ myBatch, loading, refetch: fetchMyBatch }}>
      {children}
    </TeacherBatchContext.Provider>
  );
}

export function useMyBatch() {
  const context = useContext(TeacherBatchContext);
  if (context === undefined) {
    throw new Error("useMyBatch must be used within TeacherBatchProvider");
  }
  return context;
}
