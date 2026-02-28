using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IPortalRequestRepository
{
    Task<PortalRequest?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<PortalRequest>> GetAsync(string? role, Guid? userId, CancellationToken ct = default);
    Task<PortalRequest> AddAsync(PortalRequest entity, CancellationToken ct = default);
    Task<PortalRequest> UpdateAsync(PortalRequest entity, CancellationToken ct = default);
}
