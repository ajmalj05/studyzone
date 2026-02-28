using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IAcademicYearRepository
{
    Task<AcademicYear?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<AcademicYear?> GetCurrentAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AcademicYear>> GetAllAsync(bool includeArchived, CancellationToken ct = default);
    Task<AcademicYear> AddAsync(AcademicYear entity, CancellationToken ct = default);
    Task UpdateAsync(AcademicYear entity, CancellationToken ct = default);
    Task SetCurrentAsync(Guid id, CancellationToken ct = default);
}
