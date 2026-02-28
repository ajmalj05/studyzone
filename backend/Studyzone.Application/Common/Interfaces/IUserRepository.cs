using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByUserIdAsync(string userId, CancellationToken ct = default);
    Task<User?> GetByUserIdAndRoleAsync(string userId, string role, CancellationToken ct = default);
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<User>> GetAllAsync(string? roleFilter, CancellationToken ct = default);
    Task<User> AddAsync(User user, CancellationToken ct = default);
    Task UpdateAsync(User user, CancellationToken ct = default);
}
