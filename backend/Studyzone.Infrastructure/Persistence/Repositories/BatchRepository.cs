using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class BatchRepository : IBatchRepository
{
    private readonly ApplicationDbContext _db;

    public BatchRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Batch?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Batches.Include(x => x.Class).FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<IReadOnlyList<Batch>> GetByClassIdAsync(Guid classId, CancellationToken ct = default)
    {
        return await _db.Batches.Include(x => x.Class).AsNoTracking().Where(x => x.ClassId == classId).OrderBy(x => x.Name).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Batch>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Batches.Include(x => x.Class).AsNoTracking().OrderBy(x => x.Class.Name).ThenBy(x => x.Name).ToListAsync(ct);
    }

    public async Task<Batch> AddAsync(Batch entity, CancellationToken ct = default)
    {
        _db.Batches.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Batch entity, CancellationToken ct = default)
    {
        _db.Batches.Update(entity);
        await _db.SaveChangesAsync(ct);
    }
}
