using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class AnnouncementRepository : IAnnouncementRepository
{
    private readonly ApplicationDbContext _db;

    public AnnouncementRepository(ApplicationDbContext db) => _db = db;

    public async Task<Announcement?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.Announcements.FindAsync(new object[] { id }, ct);

    public async Task<IReadOnlyList<Announcement>> GetAllAsync(int skip, int take, CancellationToken ct = default) =>
        await _db.Announcements.AsNoTracking().OrderByDescending(x => x.CreatedAt).Skip(skip).Take(take).ToListAsync(ct);

    public async Task<IReadOnlyList<Announcement>> GetForNoticeBoardAsync(Guid? classId, Guid? userId, Guid? studentId, string? userRole, int take, CancellationToken ct = default)
    {
        var query = _db.Announcements.AsNoTracking().Where(a =>
            a.AudienceType == "All"
            || (a.AudienceType == "Class" && a.TargetId == classId)
            || (a.AudienceType == "Individual" && (a.TargetId == userId || a.TargetId == studentId))
            || (a.AudienceType == "Teachers" && userRole == "teacher")
            || (a.AudienceType == "Parents" && userRole == "parent"));
        return await query.OrderByDescending(x => x.CreatedAt).Take(take).ToListAsync(ct);
    }

    public async Task<Announcement> AddAsync(Announcement entity, CancellationToken ct = default)
    {
        _db.Announcements.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.Announcements.FindAsync(new object[] { id }, ct);
        if (e != null) { _db.Announcements.Remove(e); await _db.SaveChangesAsync(ct); }
    }
}