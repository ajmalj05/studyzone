using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class FeeStructureRepository : IFeeStructureRepository
{
    private readonly ApplicationDbContext _db;

    public FeeStructureRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<FeeStructure?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.FeeStructures.FindAsync(new object[] { id }, ct);
    }

    public async Task<IReadOnlyList<FeeStructure>> GetByClassIdAsync(Guid classId, CancellationToken ct = default)
    {
        return await _db.FeeStructures.AsNoTracking().Where(x => x.ClassId == classId).OrderBy(x => x.Name).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<FeeStructure>> GetByClassIdAndAcademicYearAsync(Guid classId, Guid academicYearId, CancellationToken ct = default)
    {
        return await _db.FeeStructures.AsNoTracking()
            .Where(x => x.ClassId == classId && x.AcademicYearId == academicYearId).OrderBy(x => x.Name).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<FeeStructure>> GetByAcademicYearAsync(Guid academicYearId, CancellationToken ct = default)
    {
        return await _db.FeeStructures.AsNoTracking()
            .Where(x => x.AcademicYearId == academicYearId).OrderBy(x => x.ClassId).ThenBy(x => x.Name).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<FeeStructure>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.FeeStructures.AsNoTracking().OrderBy(x => x.ClassId).ThenBy(x => x.Name).ToListAsync(ct);
    }

    public async Task<FeeStructure> AddAsync(FeeStructure entity, CancellationToken ct = default)
    {
        _db.FeeStructures.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(FeeStructure entity, CancellationToken ct = default)
    {
        _db.FeeStructures.Update(entity);
        await _db.SaveChangesAsync(ct);
    }
}
