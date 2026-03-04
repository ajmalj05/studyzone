using Studyzone.Application.Dashboard;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Fees;

namespace Studyzone.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly IStudentEnrollmentRepository _enrollmentRepo;
    private readonly IAcademicYearRepository _academicYearRepo;
    private readonly IUserRepository _userRepo;
    private readonly IPaymentRepository _paymentRepo;
    private readonly IFeeService _feeService;
    private readonly IEnquiryRepository _enquiryRepo;
    private readonly IAdmissionApprovalRepository _approvalRepo;

    public DashboardService(
        IStudentEnrollmentRepository enrollmentRepo,
        IAcademicYearRepository academicYearRepo,
        IUserRepository userRepo,
        IPaymentRepository paymentRepo,
        IFeeService feeService,
        IEnquiryRepository enquiryRepo,
        IAdmissionApprovalRepository approvalRepo)
    {
        _enrollmentRepo = enrollmentRepo;
        _academicYearRepo = academicYearRepo;
        _userRepo = userRepo;
        _paymentRepo = paymentRepo;
        _feeService = feeService;
        _enquiryRepo = enquiryRepo;
        _approvalRepo = approvalRepo;
    }

    public async Task<DashboardKpiDto> GetKpisAsync(string? academicYearId = null, CancellationToken ct = default)
    {
        var year = await ResolveAcademicYearAsync(academicYearId, ct);
        var totalStudents = year == null ? 0 : await _enrollmentRepo.CountByAcademicYearAsync(year.Id, null, null, "Active", ct);
        var teachers = await _userRepo.GetAllAsync("teacher", ct);
        var staffCount = (await _userRepo.GetAllAsync(null, ct)).Count;
        DateTime? from = null, to = null;
        if (year != null)
        {
            from = year.StartDate;
            to = year.EndDate;
        }
        var revenue = await _paymentRepo.GetTotalRevenueAsync(from, to, ct);
        var outstanding = await _feeService.GetOutstandingByClassAsync(null, academicYearId, ct);
        var pendingDues = outstanding.Sum(x => x.Balance);
        return new DashboardKpiDto
        {
            TotalStudents = totalStudents,
            ActiveTeachers = teachers.Count,
            StaffCount = staffCount,
            RevenueCollected = revenue,
            PendingDues = pendingDues
        };
    }

    private async Task<Domain.Entities.AcademicYear?> ResolveAcademicYearAsync(string? academicYearId, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(academicYearId) && Guid.TryParse(academicYearId, out var guid))
        {
            return await _academicYearRepo.GetByIdAsync(guid, ct);
        }
        return await _academicYearRepo.GetCurrentAsync(ct);
    }

    public async Task<AdmissionPipelineDto> GetAdmissionPipelineAsync(CancellationToken ct = default)
    {
        var newCount = await _enquiryRepo.CountAsync("New", ct);
        var contacted = await _enquiryRepo.CountAsync("Contacted", ct);
        var interviewScheduled = await _enquiryRepo.CountAsync("InterviewScheduled", ct);
        var pendingApprovals = await _approvalRepo.CountPendingAsync(ct);
        return new AdmissionPipelineDto
        {
            NewEnquiries = newCount,
            Contacted = contacted,
            InterviewScheduled = interviewScheduled,
            PendingApprovals = pendingApprovals
        };
    }

    public async Task<IReadOnlyList<FeeSummaryDto>> GetFeeSummaryByClassAsync(string? academicYearId = null, CancellationToken ct = default)
    {
        var outstanding = await _feeService.GetOutstandingByClassAsync(null, academicYearId, ct);
        var byClass = outstanding.GroupBy(x => x.ClassName ?? "").Select(g => new FeeSummaryDto
        {
            ClassName = g.Key,
            Outstanding = g.Sum(x => x.Balance),
            StudentCount = g.Count()
        }).OrderByDescending(x => x.Outstanding).ToList();
        return byClass;
    }
}
