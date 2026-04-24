using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IClassRepository
{
    Task<Class?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null, CancellationToken ct = default);
    Task<bool> ExistsByCodeAsync(string code, Guid? excludeId = null, CancellationToken ct = default);
    Task<IReadOnlyList<Class>> GetAllAsync(CancellationToken ct = default);
    Task<Class> AddAsync(Class entity, CancellationToken ct = default);
    Task UpdateAsync(Class entity, CancellationToken ct = default);
}
