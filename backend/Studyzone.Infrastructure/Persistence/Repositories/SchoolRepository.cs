using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class SchoolRepository : ISchoolRepository
{
    private readonly ApplicationDbContext _db;

    public SchoolRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<School?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Schools.FindAsync(new object[] { id }, ct);
    }

    public async Task<School?> GetFirstAsync(CancellationToken ct = default)
    {
        return await _db.Schools.AsNoTracking().FirstOrDefaultAsync(ct);
    }

    public async Task<School> AddAsync(School entity, CancellationToken ct = default)
    {
        _db.Schools.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(School entity, CancellationToken ct = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _db.Schools.Update(entity);
        await _db.SaveChangesAsync(ct);
    }
}
