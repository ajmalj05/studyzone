using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class ClassRepository : IClassRepository
{
    private readonly ApplicationDbContext _db;

    public ClassRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Class?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Classes.FindAsync(new object[] { id }, ct);
    }

    public async Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null, CancellationToken ct = default)
    {
        var normalized = name.Trim().ToLower();
        return await _db.Classes
            .AsNoTracking()
            .AnyAsync(x =>
                x.Name.Trim().ToLower() == normalized &&
                (!excludeId.HasValue || x.Id != excludeId.Value),
                ct);
    }

    public async Task<bool> ExistsByCodeAsync(string code, Guid? excludeId = null, CancellationToken ct = default)
    {
        var normalized = code.Trim().ToLower();
        return await _db.Classes
            .AsNoTracking()
            .AnyAsync(x =>
                x.Code.Trim().ToLower() == normalized &&
                (!excludeId.HasValue || x.Id != excludeId.Value),
                ct);
    }

    public async Task<IReadOnlyList<Class>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Classes.AsNoTracking().OrderBy(x => x.Name).ToListAsync(ct);
    }

    public async Task<Class> AddAsync(Class entity, CancellationToken ct = default)
    {
        _db.Classes.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Class entity, CancellationToken ct = default)
    {
        _db.Classes.Update(entity);
        await _db.SaveChangesAsync(ct);
    }
}
