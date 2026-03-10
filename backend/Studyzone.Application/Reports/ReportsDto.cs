namespace Studyzone.Application.Reports;

public class EnrollmentReportDto
{
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public int StudentCount { get; set; }
}

public class BatchStrengthReportDto
{
    public string ClassName { get; set; } = string.Empty;
    public string BatchName { get; set; } = string.Empty;
    public int StudentCount { get; set; }
}

public class OutstandingByClassDto
{
    public string ClassName { get; set; } = string.Empty;
    public decimal Outstanding { get; set; }
    public int StudentCount { get; set; }
}

public class FinancialReportDto
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public decimal TotalCollection { get; set; }
    public decimal TotalOutstanding { get; set; }
    public IReadOnlyList<OutstandingByClassDto> OutstandingByClass { get; set; } = Array.Empty<OutstandingByClassDto>();
}

public class AttendanceReportRowDto
{
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? ClassName { get; set; }
    public int PresentDays { get; set; }
    public int AbsentDays { get; set; }
    public int TotalDays { get; set; }
    public double Percentage { get; set; }
    public bool ChronicAbsentee { get; set; }
}

public class AttendanceReportDto
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public string? ClassId { get; set; }
    public IReadOnlyList<AttendanceReportRowDto> Rows { get; set; } = Array.Empty<AttendanceReportRowDto>();
}

public class StudentAttendanceRecordDto
{
    public DateTime Date { get; set; }
    public int? PeriodNumber { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class StudentAttendanceDetailDto
{
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? ClassName { get; set; }
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public int PresentDays { get; set; }
    public int AbsentDays { get; set; }
    public int TotalDays { get; set; }
    public double Percentage { get; set; }
    public IReadOnlyList<StudentAttendanceRecordDto> Records { get; set; } = Array.Empty<StudentAttendanceRecordDto>();
}

public class AcademicReportRowDto
{
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public decimal TotalObtained { get; set; }
    public decimal TotalMax { get; set; }
    public double Percentage { get; set; }
    public int Rank { get; set; }
}

public class AcademicReportDto
{
    public string ExamId { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public string? ClassName { get; set; }
    public IReadOnlyList<AcademicReportRowDto> Rows { get; set; } = Array.Empty<AcademicReportRowDto>();
}

public class AdmissionConversionReportDto
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public int NewEnquiries { get; set; }
    public int Contacted { get; set; }
    public int InterviewScheduled { get; set; }
    public int AdmittedInRange { get; set; }
}

public class TeacherWorkloadRowDto
{
    public string TeacherUserId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public int PeriodsPerWeek { get; set; }
}

public class TeacherWorkloadReportDto
{
    public IReadOnlyList<TeacherWorkloadRowDto> Rows { get; set; } = Array.Empty<TeacherWorkloadRowDto>();
}
