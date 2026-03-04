using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _db;

    public UserRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<User?> GetByUserIdAsync(string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId)) return null;
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId, ct);
    }

    public async Task<User?> GetByUserIdAndRoleAsync(string userId, string role, CancellationToken ct = default)
    {
        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId && u.Role == role && u.IsActive, ct);
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Users.FindAsync(new object[] { id }, ct);
    }

    public async Task<IReadOnlyList<User>> GetAllAsync(string? roleFilter, CancellationToken ct = default)
    {
        var query = _db.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(roleFilter))
        {
            var roleLower = roleFilter.Trim().ToLower();
            query = query.Where(u => u.Role != null && u.Role.Trim().ToLower() == roleLower);
        }
        return await query.OrderBy(u => u.Name ?? "").ToListAsync(ct);
    }

    public async Task<User> AddAsync(User user, CancellationToken ct = default)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return user;
    }

    public async Task UpdateAsync(User user, CancellationToken ct = default)
    {
        user.UpdatedAt = DateTime.UtcNow;
        _db.Users.Update(user);
        await _db.SaveChangesAsync(ct);
    }
}
