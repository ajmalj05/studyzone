namespace Studyzone.Application.Attendance;

public class AttendanceRecordDto
{
    public string Id { get; set; } = string.Empty;
    public string? StudentId { get; set; }
    public string? TeacherUserId { get; set; }
    public DateTime Date { get; set; }
    public int? PeriodNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public string RecordType { get; set; } = string.Empty;
}

public class BulkAttendanceRequest
{
    public string? ClassId { get; set; }
    public string? BatchId { get; set; }
    public DateTime Date { get; set; }
    public IReadOnlyList<StudentAttendanceItem> Items { get; set; } = Array.Empty<StudentAttendanceItem>();
}

public class StudentAttendanceItem
{
    public string StudentId { get; set; } = string.Empty;
    public string Status { get; set; } = "Present"; // Present, Absent, Late
}

public class MonthlyAttendanceReportDto
{
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Late { get; set; }
    public decimal Percentage { get; set; }
}

// Teacher attendance
public class TeacherAttendanceItemDto
{
    public string TeacherUserId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string Status { get; set; } = "Present"; // Present, Absent, Late
}

public class BulkTeacherAttendanceRequest
{
    public DateTime Date { get; set; }
    public IReadOnlyList<TeacherAttendanceItemRequest> Items { get; set; } = Array.Empty<TeacherAttendanceItemRequest>();
}

public class TeacherAttendanceItemRequest
{
    public string TeacherUserId { get; set; } = string.Empty;
    public string Status { get; set; } = "Present";
}

/// <summary>Request for a teacher to mark their own attendance (teacher portal only).</summary>
public class TeacherSelfAttendanceRequest
{
    public DateTime Date { get; set; }
    public string Status { get; set; } = "Present"; // Present, Absent, Late
}
