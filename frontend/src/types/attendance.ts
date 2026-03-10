export interface StudentAttendanceRecordDto {
  date: string;
  periodNumber: number | null;
  status: string;
}

export interface StudentAttendanceDetailDto {
  studentId: string;
  studentName: string;
  className?: string | null;
  from: string;
  to: string;
  presentDays: number;
  absentDays: number;
  totalDays: number;
  percentage: number;
  records: StudentAttendanceRecordDto[];
}

