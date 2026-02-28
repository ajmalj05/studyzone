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
}

public class StudentExamResultDto
{
    public string ExamId { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public decimal MarksObtained { get; set; }
    public decimal MaxMarks { get; set; }
}
