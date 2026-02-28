using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly ApplicationDbContext _db;

    public AuditLogRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(AuditLog entry, CancellationToken ct = default)
    {
        _db.AuditLogs.Add(entry);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<AuditLog>> GetAsync(DateTime? from, DateTime? to, string? tableName, string? userId, int skip, int take, CancellationToken ct = default)
    {
        var query = _db.AuditLogs.AsNoTracking();
        if (from.HasValue)
            query = query.Where(x => x.Timestamp >= from.Value);
        if (to.HasValue)
            query = query.Where(x => x.Timestamp <= to.Value);
        if (!string.IsNullOrWhiteSpace(tableName))
            query = query.Where(x => x.TableName == tableName);
        if (!string.IsNullOrWhiteSpace(userId) && Guid.TryParse(userId, out var uid))
            query = query.Where(x => x.UserId == uid);
        return await query
            .OrderByDescending(x => x.Timestamp)
            .Skip(skip)
            .Take(take)
            .ToListAsync(ct);
    }

    public async Task<int> CountAsync(DateTime? from, DateTime? to, string? tableName, string? userId, CancellationToken ct = default)
    {
        var query = _db.AuditLogs.AsNoTracking();
        if (from.HasValue)
            query = query.Where(x => x.Timestamp >= from.Value);
        if (to.HasValue)
            query = query.Where(x => x.Timestamp <= to.Value);
        if (!string.IsNullOrWhiteSpace(tableName))
            query = query.Where(x => x.TableName == tableName);
        if (!string.IsNullOrWhiteSpace(userId) && Guid.TryParse(userId, out var uid))
            query = query.Where(x => x.UserId == uid);
        return await query.CountAsync(ct);
    }
}
