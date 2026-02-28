using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IAttendanceRepository
{
    Task<IReadOnlyList<AttendanceRecord>> GetByStudentAndDateRangeAsync(Guid studentId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<IReadOnlyList<AttendanceRecord>> GetByStudentIdsAndDateAsync(IEnumerable<Guid> studentIds, DateTime date, CancellationToken ct = default);
    Task<AttendanceRecord?> GetByStudentAndDateAsync(Guid studentId, DateTime date, int? periodNumber, CancellationToken ct = default);
    Task<AttendanceRecord> AddOrUpdateAsync(AttendanceRecord record, CancellationToken ct = default);

    Task<AttendanceRecord?> GetByTeacherAndDateAsync(Guid teacherUserId, DateTime date, CancellationToken ct = default);
    Task<IReadOnlyList<AttendanceRecord>> GetByTeacherAndDateRangeAsync(Guid teacherUserId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<AttendanceRecord> AddOrUpdateTeacherAsync(AttendanceRecord record, CancellationToken ct = default);
}
