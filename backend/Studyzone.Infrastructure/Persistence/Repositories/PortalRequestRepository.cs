using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class PortalRequestRepository : IPortalRequestRepository
{
    private readonly ApplicationDbContext _db;

    public PortalRequestRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PortalRequest?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.PortalRequests.FindAsync([id], ct);
    }

    public async Task<IReadOnlyList<PortalRequest>> GetAsync(string? role, Guid? userId, CancellationToken ct = default)
    {
        var query = _db.PortalRequests.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(x => x.Role.ToLower() == role.ToLower());
        if (userId.HasValue)
            query = query.Where(x => x.UserId == userId.Value);
        return await query.OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
    }

    public async Task<PortalRequest> AddAsync(PortalRequest entity, CancellationToken ct = default)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        _db.PortalRequests.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<PortalRequest> UpdateAsync(PortalRequest entity, CancellationToken ct = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _db.PortalRequests.Update(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }
}
