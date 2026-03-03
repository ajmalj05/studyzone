namespace Studyzone.Application.Attendance;

public interface IAttendanceService
{
    Task<IReadOnlyList<AttendanceRecordDto>> GetByStudentAsync(string studentId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<IReadOnlyList<AttendanceRecordDto>> GetByClassAndDateAsync(string classId, DateTime date, CancellationToken ct = default);
    Task<IReadOnlyList<AttendanceRecordDto>> GetByBatchAndDateAsync(string batchId, DateTime date, CancellationToken ct = default);
    Task SaveBulkAsync(BulkAttendanceRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<MonthlyAttendanceReportDto>> GetMonthlyReportAsync(string? classId, int year, int month, CancellationToken ct = default);

    Task<IReadOnlyList<TeacherAttendanceItemDto>> GetTeachersForDateAsync(DateTime date, CancellationToken ct = default);
    Task<IReadOnlyList<AttendanceRecordDto>> GetByTeacherAsync(string teacherUserId, DateTime from, DateTime to, CancellationToken ct = default);
    Task SaveBulkTeacherAsync(BulkTeacherAttendanceRequest request, CancellationToken ct = default);
    /// <summary>Save the current teacher's own attendance for a date (teacher portal).</summary>
    Task SaveSelfAttendanceAsync(string teacherUserGuid, DateTime date, string status, CancellationToken ct = default);
}
