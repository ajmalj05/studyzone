using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _db;

    public NotificationRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Notification>> GetByUserIdAsync(Guid userId, int skip, int take, CancellationToken ct = default)
    {
        return await _db.Notifications
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync(ct);
    }

    public async Task<Notification?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Notifications.FindAsync([id], ct);
    }

    public async Task<Notification> AddAsync(Notification entity, CancellationToken ct = default)
    {
        if (entity.Id == default)
            entity.Id = Guid.NewGuid();
        if (entity.CreatedAt == default)
            entity.CreatedAt = DateTime.UtcNow;
        _db.Notifications.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Notifications.FindAsync([id], ct);
        if (entity != null)
        {
            _db.Notifications.Remove(entity);
            await _db.SaveChangesAsync(ct);
        }
    }
}
