using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class TimetableSettingsRepository : ITimetableSettingsRepository
{
    private readonly ApplicationDbContext _db;

    public TimetableSettingsRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<TimetableSettings?> GetSingleAsync(CancellationToken ct = default)
    {
        return await _db.TimetableSettings.AsNoTracking().FirstOrDefaultAsync(ct);
    }

    public async Task<TimetableSettings> AddOrUpdateAsync(TimetableSettings entity, CancellationToken ct = default)
    {
        var existing = await _db.TimetableSettings.FirstOrDefaultAsync(ct);
        if (existing != null)
        {
            existing.WorkingDayCount = entity.WorkingDayCount;
            existing.PeriodsPerDay = entity.PeriodsPerDay;
            _db.TimetableSettings.Update(existing);
            await _db.SaveChangesAsync(ct);
            return existing;
        }
        if (entity.Id == Guid.Empty)
            entity.Id = Guid.NewGuid();
        _db.TimetableSettings.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }
}
