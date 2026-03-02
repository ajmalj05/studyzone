using Studyzone.Application.Administration;
using Studyzone.Application.Attendance;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class AttendanceService : IAttendanceService
{
    private readonly IAttendanceRepository _attRepo;
    private readonly IStudentEnrollmentRepository _enrollmentRepo;
    private readonly IAcademicYearRepository _academicYearRepo;
    private readonly IUserManagementService _userService;

    public AttendanceService(IAttendanceRepository attRepo, IStudentEnrollmentRepository enrollmentRepo, IAcademicYearRepository academicYearRepo, IUserManagementService userService)
    {
        _attRepo = attRepo;
        _enrollmentRepo = enrollmentRepo;
        _academicYearRepo = academicYearRepo;
        _userService = userService;
    }

    public async Task<IReadOnlyList<AttendanceRecordDto>> GetByStudentAsync(string studentId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        if (!Guid.TryParse(studentId, out var sid)) return Array.Empty<AttendanceRecordDto>();
        var list = await _attRepo.GetByStudentAndDateRangeAsync(sid, from, to, ct);
        return list.Select(x => new AttendanceRecordDto
        {
            Id = x.Id.ToString(),
            StudentId = x.StudentId?.ToString(),
            TeacherUserId = x.TeacherUserId?.ToString(),
            Date = x.Date,
            PeriodNumber = x.PeriodNumber,
            Status = x.Status,
            RecordType = x.RecordType
        }).ToList();
    }

    public async Task<IReadOnlyList<AttendanceRecordDto>> GetByClassAndDateAsync(string classId, DateTime date, CancellationToken ct = default)
    {
        if (!Guid.TryParse(classId, out var cid)) return Array.Empty<AttendanceRecordDto>();
        var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
        if (currentYear == null) return Array.Empty<AttendanceRecordDto>();
        var enrollments = await _enrollmentRepo.GetByAcademicYearAsync(currentYear.Id, cid, null, "Active", 0, 1000, ct);
        var studentIds = enrollments.Select(e => e.StudentId).ToList();
        var list = await _attRepo.GetByStudentIdsAndDateAsync(studentIds, date, ct);
        return list.Select(x => new AttendanceRecordDto
        {
            Id = x.Id.ToString(),
            StudentId = x.StudentId?.ToString(),
            Date = x.Date,
            PeriodNumber = x.PeriodNumber,
            Status = x.Status,
            RecordType = x.RecordType
        }).ToList();
    }

    public async Task SaveBulkAsync(BulkAttendanceRequest request, CancellationToken ct = default)
    {
        var date = request.Date.Date;
        foreach (var item in request.Items)
        {
            if (!Guid.TryParse(item.StudentId, out var sid)) continue;
            var record = new AttendanceRecord
            {
                StudentId = sid,
                Date = date,
                PeriodNumber = null,
                Status = item.Status,
                RecordType = "Student"
            };
            await _attRepo.AddOrUpdateAsync(record, ct);
        }
    }

    public async Task<IReadOnlyList<MonthlyAttendanceReportDto>> GetMonthlyReportAsync(string? classId, int year, int month, CancellationToken ct = default)
    {
        var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
        if (currentYear == null) return new List<MonthlyAttendanceReportDto>();
        Guid? cid = string.IsNullOrWhiteSpace(classId) || !Guid.TryParse(classId, out var g) ? null : g;
        var enrollments = await _enrollmentRepo.GetByAcademicYearAsync(currentYear.Id, cid, null, "Active", 0, 1000, ct);
        var from = new DateTime(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var result = new List<MonthlyAttendanceReportDto>();
        foreach (var enr in enrollments)
        {
            var s = enr.Student;
            if (s == null) continue;
            var records = await _attRepo.GetByStudentAndDateRangeAsync(s.Id, from, to, ct);
            var present = records.Count(x => x.Status == "Present");
            var absent = records.Count(x => x.Status == "Absent");
            var late = records.Count(x => x.Status == "Late");
            var total = present + absent + late;
            var pct = total > 0 ? (decimal)present / total * 100 : 0;
            result.Add(new MonthlyAttendanceReportDto
            {
                StudentId = s.Id.ToString(),
                StudentName = s.Name,
                Month = $"{year}-{month:D2}",
                Present = present,
                Absent = absent,
                Late = late,
                Percentage = Math.Round(pct, 1)
            });
        }
        return result.OrderByDescending(x => x.Percentage).ToList();
    }

    public async Task<IReadOnlyList<TeacherAttendanceItemDto>> GetTeachersForDateAsync(DateTime date, CancellationToken ct = default)
    {
        var teachers = await _userService.GetAllAsync("teacher", ct);
        var result = new List<TeacherAttendanceItemDto>();
        foreach (var t in teachers.Where(x => x.IsActive))
        {
            if (!Guid.TryParse(t.Id, out var tid)) continue;
            var record = await _attRepo.GetByTeacherAndDateAsync(tid, date, ct);
            result.Add(new TeacherAttendanceItemDto
            {
                TeacherUserId = t.Id,
                TeacherName = t.Name,
                Subject = null,
                Status = record?.Status ?? "Present"
            });
        }
        return result.OrderBy(x => x.TeacherName).ToList();
    }

    public async Task<IReadOnlyList<AttendanceRecordDto>> GetByTeacherAsync(string teacherUserId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        if (!Guid.TryParse(teacherUserId, out var tid)) return Array.Empty<AttendanceRecordDto>();
        var list = await _attRepo.GetByTeacherAndDateRangeAsync(tid, from, to, ct);
        return list.Select(x => new AttendanceRecordDto
        {
            Id = x.Id.ToString(),
            TeacherUserId = x.TeacherUserId?.ToString(),
            Date = x.Date,
            PeriodNumber = x.PeriodNumber,
            Status = x.Status,
            RecordType = x.RecordType
        }).ToList();
    }

    public async Task SaveBulkTeacherAsync(BulkTeacherAttendanceRequest request, CancellationToken ct = default)
    {
        var date = request.Date.Date;
        foreach (var item in request.Items)
        {
            if (!Guid.TryParse(item.TeacherUserId, out var tid)) continue;
            var record = new AttendanceRecord
            {
                TeacherUserId = tid,
                Date = date,
                PeriodNumber = null,
                Status = item.Status,
                RecordType = "Teacher"
            };
            await _attRepo.AddOrUpdateTeacherAsync(record, ct);
        }
    }

    public async Task SaveSelfAttendanceAsync(string teacherUserGuid, DateTime date, string status, CancellationToken ct = default)
    {
        if (!Guid.TryParse(teacherUserGuid, out var tid))
            throw new ArgumentException("Invalid teacher user id.", nameof(teacherUserGuid));
        var normalized = status?.Trim() ?? "Present";
        if (normalized != "Present" && normalized != "Absent" && normalized != "Late")
            normalized = "Present";
        var record = new AttendanceRecord
        {
            TeacherUserId = tid,
            Date = date.Date,
            PeriodNumber = null,
            Status = normalized,
            RecordType = "Teacher"
        };
        await _attRepo.AddOrUpdateTeacherAsync(record, ct);
    }
}
