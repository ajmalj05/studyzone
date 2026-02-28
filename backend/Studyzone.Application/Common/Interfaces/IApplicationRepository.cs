using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IApplicationRepository
{
    Task<Domain.Entities.Application?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Domain.Entities.Application>> GetAllAsync(string? statusFilter, int skip, int take, CancellationToken ct = default);
    Task<int> CountAsync(string? statusFilter, CancellationToken ct = default);
    Task<Domain.Entities.Application> AddAsync(Domain.Entities.Application entity, CancellationToken ct = default);
    Task UpdateAsync(Domain.Entities.Application entity, CancellationToken ct = default);
}
