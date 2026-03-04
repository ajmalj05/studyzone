using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Exams;
using Studyzone.Application.Fees;
using Studyzone.Application.Reports;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class ReportsService : IReportsService
{
    private readonly IClassRepository _classRepo;
    private readonly IBatchRepository _batchRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IStudentEnrollmentRepository _enrollmentRepo;
    private readonly IAcademicYearRepository _academicYearRepo;
    private readonly IPaymentRepository _paymentRepo;
    private readonly IFeeService _feeService;
    private readonly IAttendanceRepository _attendanceRepo;
    private readonly IExamRepository _examRepo;
    private readonly IMarksEntryRepository _marksRepo;
    private readonly IEnquiryRepository _enquiryRepo;
    private readonly IAdmissionApprovalRepository _approvalRepo;
    private readonly ITimetableSlotRepository _slotRepo;

    private const double ChronicAbsenteeThresholdPercent = 75;

    public ReportsService(
        IClassRepository classRepo,
        IBatchRepository batchRepo,
        IStudentRepository studentRepo,
        IStudentEnrollmentRepository enrollmentRepo,
        IAcademicYearRepository academicYearRepo,
        IPaymentRepository paymentRepo,
        IFeeService feeService,
        IAttendanceRepository attendanceRepo,
        IExamRepository examRepo,
        IMarksEntryRepository marksRepo,
        IEnquiryRepository enquiryRepo,
        IAdmissionApprovalRepository approvalRepo,
        ITimetableSlotRepository slotRepo)
    {
        _classRepo = classRepo;
        _batchRepo = batchRepo;
        _studentRepo = studentRepo;
        _enrollmentRepo = enrollmentRepo;
        _academicYearRepo = academicYearRepo;
        _paymentRepo = paymentRepo;
        _feeService = feeService;
        _attendanceRepo = attendanceRepo;
        _examRepo = examRepo;
        _marksRepo = marksRepo;
        _enquiryRepo = enquiryRepo;
        _approvalRepo = approvalRepo;
        _slotRepo = slotRepo;
    }

    public async Task<IReadOnlyList<EnrollmentReportDto>> GetEnrollmentByClassAsync(string? classId, CancellationToken ct = default)
    {
        var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
        if (currentYear == null)
            return new List<EnrollmentReportDto>();
        var classes = await _classRepo.GetAllAsync(ct);
        if (!string.IsNullOrWhiteSpace(classId) && Guid.TryParse(classId, out var cid))
            classes = classes.Where(c => c.Id == cid).ToList();
        var result = new List<EnrollmentReportDto>();
        foreach (var c in classes)
        {
            var count = await _enrollmentRepo.CountByAcademicYearAsync(currentYear.Id, c.Id, null, "Active", ct);
            result.Add(new EnrollmentReportDto
            {
                ClassId = c.Id.ToString(),
                ClassName = c.Name,
                StudentCount = count
            });
        }
        return result.OrderBy(x => x.ClassName).ToList();
    }

    public async Task<IReadOnlyList<BatchStrengthReportDto>> GetBatchStrengthAsync(string? classId, CancellationToken ct = default)
    {
        var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
        if (currentYear == null)
            return new List<BatchStrengthReportDto>();
        var batches = await _batchRepo.GetByAcademicYearAsync(currentYear.Id, ct);
        if (!string.IsNullOrWhiteSpace(classId) && Guid.TryParse(classId, out var cid))
            batches = batches.Where(b => b.ClassId == cid).ToList();
        var classes = (await _classRepo.GetAllAsync(ct)).ToDictionary(c => c.Id);
        var result = new List<BatchStrengthReportDto>();
        foreach (var b in batches)
        {
            var count = await _enrollmentRepo.CountByAcademicYearAsync(currentYear.Id, b.ClassId, b.Id, "Active", ct);
            result.Add(new BatchStrengthReportDto
            {
                ClassName = classes.GetValueOrDefault(b.ClassId)?.Name ?? "",
                BatchName = b.Name,
                StudentCount = count
            });
        }
        return result.OrderBy(x => x.ClassName).ThenBy(x => x.BatchName).ToList();
    }

    public async Task<FinancialReportDto> GetFinancialReportAsync(DateTime? from, DateTime? to, string? academicYearId = null, CancellationToken ct = default)
    {
        DateTime? reportFrom = from, reportTo = to;
        if (!string.IsNullOrWhiteSpace(academicYearId) && Guid.TryParse(academicYearId, out var yearGuid))
        {
            var year = await _academicYearRepo.GetByIdAsync(yearGuid, ct);
            if (year != null)
            {
                reportFrom = year.StartDate;
                reportTo = year.EndDate;
            }
        }
        var totalCollection = await _paymentRepo.GetTotalRevenueAsync(reportFrom, reportTo, ct);
        var outstanding = await _feeService.GetOutstandingByClassAsync(null, academicYearId, ct);
        var totalOutstanding = outstanding.Sum(x => x.Balance);
        var byClass = outstanding
            .GroupBy(x => x.ClassName ?? "")
            .Select(g => new OutstandingByClassDto { ClassName = g.Key, Outstanding = g.Sum(x => x.Balance), StudentCount = g.Count() })
            .ToList();
        return new FinancialReportDto
        {
            From = reportFrom,
            To = reportTo,
            TotalCollection = totalCollection,
            TotalOutstanding = totalOutstanding,
            OutstandingByClass = byClass
        };
    }

    public async Task<AttendanceReportDto> GetAttendanceReportAsync(string? classId, DateTime from, DateTime to, string? academicYearId = null, CancellationToken ct = default)
    {
        AcademicYear? year = null;
        if (!string.IsNullOrWhiteSpace(academicYearId) && Guid.TryParse(academicYearId, out var yearGuid))
            year = await _academicYearRepo.GetByIdAsync(yearGuid, ct);
        if (year == null)
            year = await _academicYearRepo.GetCurrentAsync(ct);
        if (year == null)
            return new AttendanceReportDto { From = from, To = to, ClassId = classId, Rows = new List<AttendanceReportRowDto>() };
        Guid? cid = null;
        if (!string.IsNullOrWhiteSpace(classId) && Guid.TryParse(classId, out var parsed))
            cid = parsed;
        var enrollments = await _enrollmentRepo.GetByAcademicYearAsync(year.Id, cid, null, "Active", 0, 5000, ct);
        var rows = new List<AttendanceReportRowDto>();
        var classDict = (await _classRepo.GetAllAsync(ct)).ToDictionary(c => c.Id);
        foreach (var enr in enrollments)
        {
            var s = enr.Student;
            if (s == null) continue;
            var records = await _attendanceRepo.GetByStudentAndDateRangeAsync(s.Id, from, to, ct);
            var presentDays = records.Count(r => r.Status == "Present" || r.Status == "Late");
            var absentDays = records.Count(r => r.Status == "Absent");
            var totalDays = presentDays + absentDays;
            var percentage = totalDays > 0 ? Math.Round(presentDays * 100.0 / totalDays, 2) : 0;
            var className = enr.ClassId.HasValue ? classDict.GetValueOrDefault(enr.ClassId.Value)?.Name : null;
            rows.Add(new AttendanceReportRowDto
            {
                StudentId = s.Id.ToString(),
                StudentName = s.Name,
                ClassName = className,
                PresentDays = presentDays,
                AbsentDays = absentDays,
                TotalDays = totalDays,
                Percentage = percentage,
                ChronicAbsentee = percentage < ChronicAbsenteeThresholdPercent && totalDays >= 5
            });
        }
        return new AttendanceReportDto { From = from, To = to, ClassId = classId, Rows = rows.OrderBy(x => x.ClassName).ThenBy(x => x.StudentName).ToList() };
    }

    public async Task<AcademicReportDto?> GetAcademicReportAsync(string examId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(examId, out var eid))
            return null;
        var exam = await _examRepo.GetByIdAsync(eid, ct);
        if (exam == null)
            return null;
        var marks = await _marksRepo.GetByExamIdAsync(eid, ct);
        var studentIds = marks.Select(m => m.StudentId).Distinct().ToList();
        var studentNames = new Dictionary<Guid, string>();
        foreach (var sid in studentIds)
        {
            var s = await _studentRepo.GetByIdAsync(sid, ct);
            studentNames[sid] = s?.Name ?? "";
        }
        var byStudent = marks
            .GroupBy(m => m.StudentId)
            .Select(g => new AcademicReportRowDto
            {
                StudentId = g.Key.ToString(),
                StudentName = studentNames.GetValueOrDefault(g.Key) ?? "",
                TotalObtained = g.Sum(x => x.MarksObtained),
                TotalMax = g.Sum(x => x.MaxMarks),
                Percentage = g.Sum(x => x.MaxMarks) > 0 ? Math.Round((double)(g.Sum(x => x.MarksObtained) / g.Sum(x => x.MaxMarks) * 100), 2) : 0,
                Rank = 0
            })
            .OrderByDescending(x => x.Percentage)
            .ToList();
        for (var i = 0; i < byStudent.Count; i++)
            byStudent[i].Rank = i + 1;
        var classDict = (await _classRepo.GetAllAsync(ct)).ToDictionary(c => c.Id);
        string? className = null;
        if (exam.ClassId.HasValue)
            className = classDict.GetValueOrDefault(exam.ClassId.Value)?.Name;
        return new AcademicReportDto
        {
            ExamId = examId,
            ExamName = exam.Name,
            ClassName = className,
            Rows = byStudent
        };
    }

    public async Task<AdmissionConversionReportDto> GetAdmissionConversionAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var newCount = await _enquiryRepo.CountAsync("New", ct);
        var contacted = await _enquiryRepo.CountAsync("Contacted", ct);
        var interviewScheduled = await _enquiryRepo.CountAsync("InterviewScheduled", ct);
        var fromDate = from ?? DateTime.UtcNow.AddMonths(-1);
        var toDate = to ?? DateTime.UtcNow;
        var admittedInRange = await _approvalRepo.CountApprovedInRangeAsync(fromDate, toDate, ct);
        return new AdmissionConversionReportDto
        {
            From = from,
            To = to,
            NewEnquiries = newCount,
            Contacted = contacted,
            InterviewScheduled = interviewScheduled,
            AdmittedInRange = admittedInRange
        };
    }

    public async Task<TeacherWorkloadReportDto> GetTeacherWorkloadAsync(CancellationToken ct = default)
    {
        var slots = await _slotRepo.GetAllAsync(ct);
        var byTeacher = slots
            .Where(x => x.TeacherUserId.HasValue)
            .GroupBy(x => x.TeacherUserId!.Value)
            .Select(g => new TeacherWorkloadRowDto
            {
                TeacherUserId = g.Key.ToString(),
                TeacherName = g.First().TeacherName ?? "",
                PeriodsPerWeek = g.Count()
            })
            .OrderByDescending(x => x.PeriodsPerWeek)
            .ToList();
        return new TeacherWorkloadReportDto { Rows = byTeacher };
    }
}
