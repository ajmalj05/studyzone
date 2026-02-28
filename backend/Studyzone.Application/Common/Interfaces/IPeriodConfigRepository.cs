using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IPeriodConfigRepository
{
    Task<PeriodConfig?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<PeriodConfig>> GetAllAsync(CancellationToken ct = default);
    Task<PeriodConfig> AddAsync(PeriodConfig entity, CancellationToken ct = default);
    Task UpdateAsync(PeriodConfig entity, CancellationToken ct = default);
}
