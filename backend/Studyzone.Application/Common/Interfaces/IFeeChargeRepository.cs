using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IFeeChargeRepository
{
    Task<IReadOnlyList<FeeCharge>> GetByStudentIdAsync(Guid studentId, string? periodFilter, CancellationToken ct = default);
    Task<decimal> GetTotalChargesAsync(Guid studentId, string? periodFrom, string? periodTo, CancellationToken ct = default);
    Task<int> CountByFeeStructureIdAsync(Guid feeStructureId, CancellationToken ct = default);
    Task<FeeCharge> AddAsync(FeeCharge entity, CancellationToken ct = default);
}
