using Studyzone.Application.Administration;
using Studyzone.Application.Attendance;
using Studyzone.Application.Communication;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Exams;
using Studyzone.Application.Fees;
using Studyzone.Application.Portal;
using Studyzone.Application.TeacherSalary;
using Studyzone.Application.Timetable;

namespace Studyzone.Infrastructure.Services;

public class PortalService : IPortalService
{
    private readonly IStudentRepository _studentRepo;
    private readonly IStudentEnrollmentRepository _enrollmentRepo;
    private readonly IClassRepository _classRepo;
    private readonly IBatchRepository _batchRepo;
    private readonly IAttendanceRepository _attendanceRepo;
    private readonly IFeeService _feeService;
    private readonly IExamRepository _examRepo;
    private readonly ITimetableService _timetableService;
    private readonly IAttendanceService _attendanceService;
    private readonly IExamService _examService;
    private readonly IAnnouncementService _announcementService;
    private readonly ITimetableSlotRepository _slotRepo;
    private readonly IPeriodConfigRepository _periodRepo;
    private readonly IUserManagementService _userService;
    private readonly ITeacherSalaryService _salaryService;
    private readonly IAcademicYearRepository _academicYearRepo;

    public PortalService(
        IStudentRepository studentRepo,
        IStudentEnrollmentRepository enrollmentRepo,
        IClassRepository classRepo,
        IBatchRepository batchRepo,
        IAttendanceRepository attendanceRepo,
        IFeeService feeService,
        IExamRepository examRepo,
        ITimetableService timetableService,
        IAttendanceService attendanceService,
        IExamService examService,
        IAnnouncementService announcementService,
        ITimetableSlotRepository slotRepo,
        IPeriodConfigRepository periodRepo,
        IUserManagementService userService,
        ITeacherSalaryService salaryService,
        IAcademicYearRepository academicYearRepo)
    {
        _studentRepo = studentRepo;
        _enrollmentRepo = enrollmentRepo;
        _classRepo = classRepo;
        _batchRepo = batchRepo;
        _attendanceRepo = attendanceRepo;
        _feeService = feeService;
        _examRepo = examRepo;
        _timetableService = timetableService;
        _attendanceService = attendanceService;
        _examService = examService;
        _announcementService = announcementService;
        _slotRepo = slotRepo;
        _periodRepo = periodRepo;
        _userService = userService;
        _salaryService = salaryService;
        _academicYearRepo = academicYearRepo;
    }

    public async Task<StudentPortalProfileDto?> GetStudentProfileAsync(string userGuid, CancellationToken ct = default)
    {
        if (!Guid.TryParse(userGuid, out var uid))
            return null;
        var student = await _studentRepo.GetByUserIdAsync(uid, ct);
        if (student == null)
            return null;
        var enr = await _enrollmentRepo.GetCurrentForStudentAsync(student.Id, ct);
        string? className = null, batchName = null;
        if (enr?.ClassId.HasValue == true)
            className = (await _classRepo.GetByIdAsync(enr.ClassId.Value, ct))?.Name;
        if (enr?.BatchId.HasValue == true)
            batchName = (await _batchRepo.GetByIdAsync(enr.BatchId.Value, ct))?.Name;
        return new StudentPortalProfileDto
        {
            Id = student.Id.ToString(),
            AdmissionNumber = student.AdmissionNumber,
            Name = student.Name,
            ClassName = className,
            BatchName = batchName
        };
    }

    public async Task<StudentPortalDashboardDto> GetStudentDashboardAsync(string userGuid, CancellationToken ct = default)
    {
        var profile = await GetStudentProfileAsync(userGuid, ct);
        if (profile == null)
            return new StudentPortalDashboardDto { Student = null, AttendancePercent = null, PendingFees = 0, UpcomingExamsCount = 0 };

        if (!Guid.TryParse(profile.Id, out var studentId))
            return new StudentPortalDashboardDto { Student = profile, PendingFees = 0, UpcomingExamsCount = 0 };

        var student = await _studentRepo.GetByIdAsync(studentId, ct);
        if (student == null)
            return new StudentPortalDashboardDto { Student = profile, PendingFees = 0, UpcomingExamsCount = 0 };
        var enr = await _enrollmentRepo.GetCurrentForStudentAsync(studentId, ct);

        var to = DateTime.UtcNow.Date;
        var from = to.AddDays(-30);
        var records = await _attendanceRepo.GetByStudentAndDateRangeAsync(studentId, from, to, ct);
        var present = records.Count(r => r.Status == "Present" || r.Status == "Late");
        var total = present + records.Count(r => r.Status == "Absent");
        double? attendancePercent = total > 0 ? Math.Round(present * 100.0 / total, 1) : null;

        var ledger = await _feeService.GetLedgerAsync(profile.Id, null, null, ct);
        var pendingFees = ledger.Balance;

        var exams = enr?.ClassId.HasValue == true ? await _examRepo.GetAllAsync(enr.ClassId, ct) : Array.Empty<Domain.Entities.Exam>();
        var upcomingExamsCount = exams.Count(e => e.ExamDate.HasValue && e.ExamDate.Value.Date >= DateTime.UtcNow.Date);

        return new StudentPortalDashboardDto
        {
            Student = profile,
            AttendancePercent = attendancePercent,
            PendingFees = pendingFees,
            UpcomingExamsCount = upcomingExamsCount
        };
    }

    public async Task<IReadOnlyList<TimetableSlotDto>> GetStudentTimetableAsync(string userGuid, CancellationToken ct = default)
    {
        var profile = await GetStudentProfileAsync(userGuid, ct);
        if (profile == null) return Array.Empty<TimetableSlotDto>();
        if (!Guid.TryParse(profile.Id, out var studentId)) return Array.Empty<TimetableSlotDto>();
        var enr = await _enrollmentRepo.GetCurrentForStudentAsync(studentId, ct);
        if (enr?.BatchId == null) return Array.Empty<TimetableSlotDto>();
        return await _timetableService.GetSlotsByBatchAsync(enr.BatchId.Value.ToString(), ct);
    }

    public async Task<IReadOnlyList<AttendanceRecordDto>> GetStudentAttendanceAsync(string userGuid, DateTime from, DateTime to, CancellationToken ct = default)
    {
        var profile = await GetStudentProfileAsync(userGuid, ct);
        if (profile == null) return Array.Empty<AttendanceRecordDto>();
        return await _attendanceService.GetByStudentAsync(profile.Id, from, to, ct);
    }

    public async Task<FeeLedgerDto?> GetStudentFeeLedgerAsync(string userGuid, string? periodFrom, string? periodTo, CancellationToken ct = default)
    {
        var profile = await GetStudentProfileAsync(userGuid, ct);
        if (profile == null) return null;
        return await _feeService.GetLedgerAsync(profile.Id, periodFrom, periodTo, ct);
    }

    public async Task<IReadOnlyList<StudentExamResultDto>> GetStudentResultsAsync(string userGuid, CancellationToken ct = default)
    {
        var profile = await GetStudentProfileAsync(userGuid, ct);
        if (profile == null) return Array.Empty<StudentExamResultDto>();
        if (!Guid.TryParse(profile.Id, out var studentId)) return Array.Empty<StudentExamResultDto>();
        var enr = await _enrollmentRepo.GetCurrentForStudentAsync(studentId, ct);
        if (enr?.ClassId == null) return Array.Empty<StudentExamResultDto>();
        var exams = await _examRepo.GetAllAsync(enr.ClassId, ct);
        var list = new List<StudentExamResultDto>();
        foreach (var exam in exams)
        {
            var marks = await _examService.GetMarksByExamAsync(exam.Id.ToString(), ct);
            foreach (var m in marks.Where(x => x.StudentId == profile.Id))
                list.Add(new StudentExamResultDto { ExamId = exam.Id.ToString(), ExamName = exam.Name, Subject = m.Subject, MarksObtained = m.MarksObtained, MaxMarks = m.MaxMarks });
        }
        return list;
    }

    public async Task<IReadOnlyList<AnnouncementDto>> GetStudentNoticesAsync(string userGuid, int take = 50, CancellationToken ct = default)
    {
        var profile = await GetStudentProfileAsync(userGuid, ct);
        if (profile == null) return Array.Empty<AnnouncementDto>();
        if (!Guid.TryParse(userGuid, out var uid) || !Guid.TryParse(profile.Id, out var studentId))
            return Array.Empty<AnnouncementDto>();
        var enr = await _enrollmentRepo.GetCurrentForStudentAsync(studentId, ct);
        var classId = enr?.ClassId;
        // Pass null for userRole since this is student portal - students see "All", "Class", "Individual", but not "Teachers"/"Parents" targeted announcements
        return await _announcementService.GetNoticeBoardAsync(classId, uid, studentId, null, take, ct);
    }

    public async Task<TeacherPortalDashboardDto> GetTeacherDashboardAsync(string teacherUserGuid, CancellationToken ct = default)
    {
        if (!Guid.TryParse(teacherUserGuid, out var teacherId))
            return new TeacherPortalDashboardDto();

        var user = await _userService.GetByIdAsync(teacherUserGuid, ct);
        var slots = await _slotRepo.GetByTeacherUserIdAsync(teacherId, ct);
        var periodConfigs = await _periodRepo.GetAllAsync(ct);
        var todayDayOfWeek = (int)DateTime.UtcNow.DayOfWeek;
        if (todayDayOfWeek == 0) todayDayOfWeek = 7;

        var todaySlots = slots.Where(s => s.DayOfWeek == todayDayOfWeek).OrderBy(s => s.PeriodOrder).ToList();
        var todayDtos = new List<TeacherTodaySlotDto>();
        foreach (var s in todaySlots)
        {
            var period = periodConfigs.FirstOrDefault(p => p.DayOfWeek == todayDayOfWeek && p.PeriodOrder == s.PeriodOrder);
            var batch = await _batchRepo.GetByIdAsync(s.BatchId, ct);
            todayDtos.Add(new TeacherTodaySlotDto
            {
                Id = s.Id.ToString(),
                BatchName = batch?.Name ?? "",
                Subject = s.Subject,
                Room = s.Room,
                StartTime = period?.StartTime.ToString(@"hh\:mm") ?? "",
                EndTime = period?.EndTime.ToString(@"hh\:mm") ?? ""
            });
        }

        // Teachers see "All" and "Teachers" targeted announcements
        var notices = await _announcementService.GetNoticeBoardAsync(null, teacherId, null, "teacher", 10, ct);
        var salary = await _salaryService.GetCurrentForTeacherAsync(teacherUserGuid, ct);

        return new TeacherPortalDashboardDto
        {
            TeacherName = user?.Name,
            TodaySlots = todayDtos,
            ClassesTodayCount = todayDtos.Count,
            PendingAttendanceCount = 0,
            CurrentSalaryAmount = salary?.Amount,
            Notices = notices
        };
    }

    public async Task<IReadOnlyList<TimetableSlotDto>> GetTeacherTimetableAsync(string teacherUserGuid, CancellationToken ct = default)
    {
        if (!Guid.TryParse(teacherUserGuid, out var teacherId))
            return Array.Empty<TimetableSlotDto>();
        var slots = await _slotRepo.GetByTeacherUserIdAsync(teacherId, ct);
        var result = new List<TimetableSlotDto>();
        foreach (var s in slots)
        {
            var batch = await _batchRepo.GetByIdAsync(s.BatchId, ct);
            result.Add(new TimetableSlotDto
            {
                Id = s.Id.ToString(),
                BatchId = s.BatchId.ToString(),
                BatchName = batch?.Name ?? "",
                DayOfWeek = s.DayOfWeek,
                PeriodOrder = s.PeriodOrder,
                Subject = s.Subject,
                Room = s.Room,
                TeacherUserId = s.TeacherUserId?.ToString(),
                TeacherName = s.TeacherName,
                IsPublished = s.IsPublished
            });
        }
        return result;
    }

    public async Task<IReadOnlyList<string>> GetTeacherAssignedClassIdsAsync(string teacherUserGuid, CancellationToken ct = default)
    {
        var batchIds = await GetTeacherAssignedBatchIdsAsync(teacherUserGuid, ct);
        var classIds = new HashSet<string>();
        foreach (var batchId in batchIds)
        {
            var batch = await _batchRepo.GetByIdAsync(batchId, ct);
            if (batch != null)
                classIds.Add(batch.ClassId.ToString());
        }
        return classIds.ToList();
    }

    public async Task<IReadOnlyList<TeacherAssignedBatchDto>> GetTeacherAssignedBatchesAsync(string teacherUserGuid, CancellationToken ct = default)
    {
        var batchIds = await GetTeacherAssignedBatchIdsAsync(teacherUserGuid, ct);
        var result = new List<TeacherAssignedBatchDto>();
        foreach (var batchId in batchIds)
        {
            var batch = await _batchRepo.GetByIdAsync(batchId, ct);
            if (batch == null) continue;
            var cls = await _classRepo.GetByIdAsync(batch.ClassId, ct);
            result.Add(new TeacherAssignedBatchDto
            {
                Id = batch.Id.ToString(),
                Name = batch.Name,
                ClassId = batch.ClassId.ToString(),
                ClassName = cls?.Name ?? ""
            });
        }
        return result;
    }

    private async Task<IReadOnlyList<Guid>> GetTeacherAssignedBatchIdsAsync(string teacherUserGuid, CancellationToken ct = default)
    {
        if (!Guid.TryParse(teacherUserGuid, out var teacherId))
            return Array.Empty<Guid>();
        var batchIds = new HashSet<Guid>();
        var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
        if (currentYear != null)
        {
            var myBatch = await _batchRepo.GetByClassTeacherUserIdAndAcademicYearAsync(teacherId, currentYear.Id, ct);
            if (myBatch != null)
                batchIds.Add(myBatch.Id);
        }
        var slots = await _slotRepo.GetByTeacherUserIdAsync(teacherId, ct);
        foreach (var s in slots)
            batchIds.Add(s.BatchId);
        return batchIds.ToList();
    }
}
