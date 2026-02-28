using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class PeriodConfigRepository : IPeriodConfigRepository
{
    private readonly ApplicationDbContext _db;

    public PeriodConfigRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PeriodConfig?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.PeriodConfigs.FindAsync(new object[] { id }, ct);
    }

    public async Task<IReadOnlyList<PeriodConfig>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.PeriodConfigs.AsNoTracking().OrderBy(x => x.DayOfWeek).ThenBy(x => x.PeriodOrder).ToListAsync(ct);
    }

    public async Task<PeriodConfig> AddAsync(PeriodConfig entity, CancellationToken ct = default)
    {
        _db.PeriodConfigs.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(PeriodConfig entity, CancellationToken ct = default)
    {
        _db.PeriodConfigs.Update(entity);
        await _db.SaveChangesAsync(ct);
    }
}
