using Studyzone.Application.Administration;
using Studyzone.Application.Attendance;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Communication;
using Studyzone.Application.Exams;
using Studyzone.Application.Fees;
using Studyzone.Application.ParentPortal;
using Studyzone.Application.Portal;
using Studyzone.Application.Timetable;

namespace Studyzone.Infrastructure.Services;

public class ParentPortalService : IParentPortalService
{
    private readonly IStudentParentRepository _studentParentRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IClassRepository _classRepo;
    private readonly IBatchRepository _batchRepo;
    private readonly IAttendanceService _attendanceService;
    private readonly IFeeService _feeService;
    private readonly IExamRepository _examRepo;
    private readonly IExamService _examService;
    private readonly ITimetableService _timetableService;
    private readonly IAnnouncementService _announcementService;
    private readonly IUserManagementService _userService;

    public ParentPortalService(
        IStudentParentRepository studentParentRepo,
        IStudentRepository studentRepo,
        IClassRepository classRepo,
        IBatchRepository batchRepo,
        IAttendanceService attendanceService,
        IFeeService feeService,
        IExamRepository examRepo,
        IExamService examService,
        ITimetableService timetableService,
        IAnnouncementService announcementService,
        IUserManagementService userService)
    {
        _studentParentRepo = studentParentRepo;
        _studentRepo = studentRepo;
        _classRepo = classRepo;
        _batchRepo = batchRepo;
        _attendanceService = attendanceService;
        _feeService = feeService;
        _examRepo = examRepo;
        _examService = examService;
        _timetableService = timetableService;
        _announcementService = announcementService;
        _userService = userService;
    }

    public async Task<ParentDashboardDto> GetDashboardAsync(string parentUserGuid, CancellationToken ct = default)
    {
        var children = await GetMyChildrenAsync(parentUserGuid, ct);
        var user = await _userService.GetByIdAsync(parentUserGuid, ct);
        decimal totalPending = 0;
        foreach (var c in children)
        {
            var ledger = await _feeService.GetLedgerAsync(c.StudentId, null, null, ct);
            totalPending += ledger.Balance;
        }
        var notices = await _announcementService.GetNoticeBoardAsync(null, null, null, 10, ct);
        return new ParentDashboardDto
        {
            ParentName = user?.Name,
            Children = children,
            TotalChildren = children.Count,
            TotalPendingFees = totalPending,
            RecentNotices = notices
        };
    }

    public async Task<IReadOnlyList<ParentChildDto>> GetMyChildrenAsync(string parentUserGuid, CancellationToken ct = default)
    {
        if (!Guid.TryParse(parentUserGuid, out var parentId))
            return Array.Empty<ParentChildDto>();
        var links = await _studentParentRepo.GetByParentUserIdAsync(parentId, ct);
        var result = new List<ParentChildDto>();
        foreach (var link in links)
        {
            var student = await _studentRepo.GetByIdAsync(link.StudentId, ct);
            if (student == null) continue;
            string? className = null, batchName = null;
            if (student.ClassId.HasValue)
                className = (await _classRepo.GetByIdAsync(student.ClassId.Value, ct))?.Name;
            if (student.BatchId.HasValue)
                batchName = (await _batchRepo.GetByIdAsync(student.BatchId.Value, ct))?.Name;
            result.Add(new ParentChildDto
            {
                StudentId = student.Id.ToString(),
                Name = student.Name,
                AdmissionNumber = student.AdmissionNumber,
                ClassName = className,
                BatchName = batchName,
                Section = student.Section
            });
        }
        return result;
    }

    public async Task<bool> CanAccessStudentAsync(string parentUserGuid, string studentId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(parentUserGuid, out var parentId) || !Guid.TryParse(studentId, out var sid))
            return false;
        var link = await _studentParentRepo.GetAsync(sid, parentId, ct);
        return link != null;
    }

    public async Task<IReadOnlyList<AttendanceRecordDto>> GetChildAttendanceAsync(string parentUserGuid, string studentId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        if (!await CanAccessStudentAsync(parentUserGuid, studentId, ct))
            return Array.Empty<AttendanceRecordDto>();
        return await _attendanceService.GetByStudentAsync(studentId, from, to, ct);
    }

    public async Task<FeeLedgerDto?> GetChildFeesAsync(string parentUserGuid, string studentId, string? periodFrom, string? periodTo, CancellationToken ct = default)
    {
        if (!await CanAccessStudentAsync(parentUserGuid, studentId, ct))
            return null;
        return await _feeService.GetLedgerAsync(studentId, periodFrom, periodTo, ct);
    }

    public async Task<IReadOnlyList<StudentExamResultDto>> GetChildResultsAsync(string parentUserGuid, string studentId, CancellationToken ct = default)
    {
        if (!await CanAccessStudentAsync(parentUserGuid, studentId, ct))
            return Array.Empty<StudentExamResultDto>();
        var student = await _studentRepo.GetByIdAsync(Guid.Parse(studentId), ct);
        if (student?.ClassId == null) return Array.Empty<StudentExamResultDto>();
        var exams = await _examRepo.GetAllAsync(student.ClassId, ct);
        var list = new List<StudentExamResultDto>();
        foreach (var exam in exams)
        {
            var marks = await _examService.GetMarksByExamAsync(exam.Id.ToString(), ct);
            foreach (var m in marks.Where(x => x.StudentId == studentId))
                list.Add(new StudentExamResultDto { ExamId = exam.Id.ToString(), ExamName = exam.Name, Subject = m.Subject, MarksObtained = m.MarksObtained, MaxMarks = m.MaxMarks });
        }
        return list;
    }

    public async Task<IReadOnlyList<TimetableSlotDto>> GetChildTimetableAsync(string parentUserGuid, string studentId, CancellationToken ct = default)
    {
        if (!await CanAccessStudentAsync(parentUserGuid, studentId, ct))
            return Array.Empty<TimetableSlotDto>();
        var student = await _studentRepo.GetByIdAsync(Guid.Parse(studentId), ct);
        if (student?.BatchId == null) return Array.Empty<TimetableSlotDto>();
        return await _timetableService.GetSlotsByBatchAsync(student.BatchId.Value.ToString(), ct);
    }

    public async Task<IReadOnlyList<AnnouncementDto>> GetAnnouncementsAsync(string parentUserGuid, int take = 50, CancellationToken ct = default)
    {
        return await _announcementService.GetNoticeBoardAsync(null, null, null, take, ct);
    }
}
