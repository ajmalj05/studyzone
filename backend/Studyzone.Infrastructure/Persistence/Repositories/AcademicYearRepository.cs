using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class AcademicYearRepository : IAcademicYearRepository
{
    private readonly ApplicationDbContext _db;

    public AcademicYearRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<AcademicYear?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.AcademicYears.FindAsync(new object[] { id }, ct);
    }

    public async Task<AcademicYear?> GetCurrentAsync(CancellationToken ct = default)
    {
        return await _db.AcademicYears
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.IsCurrent, ct);
    }

    public async Task<IReadOnlyList<AcademicYear>> GetAllAsync(bool includeArchived, CancellationToken ct = default)
    {
        var query = _db.AcademicYears.AsNoTracking();
        if (!includeArchived)
            query = query.Where(x => !x.IsArchived);
        return await query.OrderByDescending(x => x.StartDate).ToListAsync(ct);
    }

    public async Task<AcademicYear> AddAsync(AcademicYear entity, CancellationToken ct = default)
    {
        _db.AcademicYears.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(AcademicYear entity, CancellationToken ct = default)
    {
        _db.AcademicYears.Update(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task SetCurrentAsync(Guid id, CancellationToken ct = default)
    {
        var all = await _db.AcademicYears.ToListAsync(ct);
        foreach (var y in all)
            y.IsCurrent = y.Id == id;
        await _db.SaveChangesAsync(ct);
    }
}
