using Studyzone.Application.Attendance;
using Studyzone.Application.Communication;
using Studyzone.Application.Exams;
using Studyzone.Application.Fees;
using Studyzone.Application.Timetable;

namespace Studyzone.Application.Portal;

public interface IPortalService
{
    Task<StudentPortalProfileDto?> GetStudentProfileAsync(string userGuid, CancellationToken ct = default);
    Task<StudentPortalDashboardDto> GetStudentDashboardAsync(string userGuid, CancellationToken ct = default);
    Task<IReadOnlyList<TimetableSlotDto>> GetStudentTimetableAsync(string userGuid, CancellationToken ct = default);
    Task<IReadOnlyList<AttendanceRecordDto>> GetStudentAttendanceAsync(string userGuid, DateTime from, DateTime to, CancellationToken ct = default);
    Task<FeeLedgerDto?> GetStudentFeeLedgerAsync(string userGuid, string? periodFrom, string? periodTo, CancellationToken ct = default);
    Task<IReadOnlyList<StudentExamResultDto>> GetStudentResultsAsync(string userGuid, CancellationToken ct = default);
    Task<IReadOnlyList<AnnouncementDto>> GetStudentNoticesAsync(string userGuid, int take = 50, CancellationToken ct = default);

    Task<TeacherPortalDashboardDto> GetTeacherDashboardAsync(string teacherUserGuid, CancellationToken ct = default);
    Task<IReadOnlyList<TimetableSlotDto>> GetTeacherTimetableAsync(string teacherUserGuid, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetTeacherAssignedClassIdsAsync(string teacherUserGuid, CancellationToken ct = default);
    Task<IReadOnlyList<TeacherAssignedBatchDto>> GetTeacherAssignedBatchesAsync(string teacherUserGuid, CancellationToken ct = default);
    /// <summary>Returns null if the teacher has no assignment to this class. Subject scope is all subjects when <see cref="TeacherMarksScopeDto.IsClassTeacher"/> is true; otherwise timetable subjects only.</summary>
    Task<TeacherMarksScopeDto?> GetTeacherMarksScopeForClassAsync(string teacherUserGuid, string classId, CancellationToken ct = default);
    Task<bool> IsTeacherAssignedToBatchAsync(string teacherUserGuid, string batchId, CancellationToken ct = default);
}

public class TeacherAssignedBatchDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    /// <summary>True when this teacher is the designated class teacher for this batch.</summary>
    public bool IsClassTeacher { get; set; }
    /// <summary>Distinct subjects from timetable slots for this teacher in this batch.</summary>
    public IReadOnlyList<string> SubjectsTaught { get; set; } = Array.Empty<string>();
}

public class TeacherMarksScopeDto
{
    /// <summary>True when this teacher is class teacher for at least one batch in this class.</summary>
    public bool IsClassTeacher { get; set; }
    /// <summary>When <see cref="IsClassTeacher"/> is false, marks are limited to these subjects (from timetable). Empty means no subject assignment.</summary>
    public IReadOnlyList<string> SubjectScope { get; set; } = Array.Empty<string>();
}

public class StudentExamResultDto
{
    public string ExamId { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public decimal MarksObtained { get; set; }
    public decimal MaxMarks { get; set; }
}
