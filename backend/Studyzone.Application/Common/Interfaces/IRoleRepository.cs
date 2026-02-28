using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IRoleRepository
{
    Task<Role?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Role?> GetByNameAsync(string name, CancellationToken ct = default);
    Task<IReadOnlyList<Role>> GetAllAsync(CancellationToken ct = default);
    Task<Role> AddAsync(Role entity, CancellationToken ct = default);
    Task UpdateAsync(Role entity, CancellationToken ct = default);
}
