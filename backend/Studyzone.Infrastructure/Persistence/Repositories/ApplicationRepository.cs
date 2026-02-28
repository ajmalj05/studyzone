using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class ApplicationRepository : IApplicationRepository
{
    private readonly ApplicationDbContext _db;

    public ApplicationRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Domain.Entities.Application?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Applications.FindAsync(new object[] { id }, ct);
    }

    public async Task<IReadOnlyList<Domain.Entities.Application>> GetAllAsync(string? statusFilter, int skip, int take, CancellationToken ct = default)
    {
        var query = _db.Applications.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(statusFilter))
            query = query.Where(x => x.Status == statusFilter);
        return await query.OrderByDescending(x => x.CreatedAt).Skip(skip).Take(take).ToListAsync(ct);
    }

    public async Task<int> CountAsync(string? statusFilter, CancellationToken ct = default)
    {
        var query = _db.Applications.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(statusFilter))
            query = query.Where(x => x.Status == statusFilter);
        return await query.CountAsync(ct);
    }

    public async Task<Domain.Entities.Application> AddAsync(Domain.Entities.Application entity, CancellationToken ct = default)
    {
        _db.Applications.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Domain.Entities.Application entity, CancellationToken ct = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _db.Applications.Update(entity);
        await _db.SaveChangesAsync(ct);
    }
}
