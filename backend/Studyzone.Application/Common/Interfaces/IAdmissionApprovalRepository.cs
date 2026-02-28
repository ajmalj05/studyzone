using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IAdmissionApprovalRepository
{
    Task<AdmissionApproval?> GetByApplicationIdAsync(Guid applicationId, CancellationToken ct = default);
    Task<IReadOnlyList<AdmissionApproval>> GetPendingAsync(int skip, int take, CancellationToken ct = default);
    Task<int> CountPendingAsync(CancellationToken ct = default);
    Task<int> CountApprovedInRangeAsync(DateTime from, DateTime to, CancellationToken ct = default);
    Task<AdmissionApproval> AddAsync(AdmissionApproval entity, CancellationToken ct = default);
    Task UpdateAsync(AdmissionApproval entity, CancellationToken ct = default);
}
