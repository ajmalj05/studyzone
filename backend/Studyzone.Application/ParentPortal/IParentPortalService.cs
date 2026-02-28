using Studyzone.Application.Attendance;
using Studyzone.Application.Communication;
using Studyzone.Application.Fees;
using Studyzone.Application.Portal;
using Studyzone.Application.Timetable;

namespace Studyzone.Application.ParentPortal;

public interface IParentPortalService
{
    Task<ParentDashboardDto> GetDashboardAsync(string parentUserGuid, CancellationToken ct = default);
    Task<IReadOnlyList<ParentChildDto>> GetMyChildrenAsync(string parentUserGuid, CancellationToken ct = default);
    Task<bool> CanAccessStudentAsync(string parentUserGuid, string studentId, CancellationToken ct = default);
    Task<IReadOnlyList<AttendanceRecordDto>> GetChildAttendanceAsync(string parentUserGuid, string studentId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<FeeLedgerDto?> GetChildFeesAsync(string parentUserGuid, string studentId, string? periodFrom, string? periodTo, CancellationToken ct = default);
    Task<IReadOnlyList<StudentExamResultDto>> GetChildResultsAsync(string parentUserGuid, string studentId, CancellationToken ct = default);
    Task<IReadOnlyList<TimetableSlotDto>> GetChildTimetableAsync(string parentUserGuid, string studentId, CancellationToken ct = default);
    Task<IReadOnlyList<AnnouncementDto>> GetAnnouncementsAsync(string parentUserGuid, int take = 50, CancellationToken ct = default);
}
