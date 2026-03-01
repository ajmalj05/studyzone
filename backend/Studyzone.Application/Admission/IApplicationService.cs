namespace Studyzone.Application.Admission;

public interface IApplicationService
{
    Task<ApplicationDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<(IReadOnlyList<ApplicationDto> Items, int Total)> GetAllAsync(string? statusFilter, string? classId, string? batchId, int skip, int take, CancellationToken ct = default);
    Task<ApplicationDto> CreateAsync(CreateApplicationRequest request, CancellationToken ct = default);
    Task<ApplicationDto> UpdateAsync(string id, UpdateApplicationRequest request, CancellationToken ct = default);
    Task<ApplicationDto> SubmitForApprovalAsync(string id, SubmitForApprovalRequest request, CancellationToken ct = default);
    Task<(IReadOnlyList<ApplicationDto> Items, int Total)> GetPendingApprovalsAsync(int skip, int take, CancellationToken ct = default);
    Task<ApplicationDto> ApproveOrRejectAsync(string id, ApprovalDecisionRequest request, string approvedByUserId, CancellationToken ct = default);
    Task<ApplicationDto> SubmitAndEnrollAsync(string id, CancellationToken ct = default);
}
