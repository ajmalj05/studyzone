using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class StudentParentRepository : IStudentParentRepository
{
    private readonly ApplicationDbContext _db;

    public StudentParentRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<StudentParent>> GetByParentUserIdAsync(Guid parentUserId, CancellationToken ct = default)
    {
        return await _db.StudentParents.AsNoTracking()
            .Where(x => x.ParentUserId == parentUserId)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<StudentParent>> GetByStudentIdAsync(Guid studentId, CancellationToken ct = default)
    {
        return await _db.StudentParents.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .ToListAsync(ct);
    }

    public async Task<StudentParent?> GetAsync(Guid studentId, Guid parentUserId, CancellationToken ct = default)
    {
        return await _db.StudentParents
            .FirstOrDefaultAsync(x => x.StudentId == studentId && x.ParentUserId == parentUserId, ct);
    }

    public async Task<StudentParent> AddAsync(StudentParent entity, CancellationToken ct = default)
    {
        _db.StudentParents.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task RemoveAsync(Guid studentId, Guid parentUserId, CancellationToken ct = default)
    {
        var existing = await _db.StudentParents
            .FirstOrDefaultAsync(x => x.StudentId == studentId && x.ParentUserId == parentUserId, ct);
        if (existing != null)
        {
            _db.StudentParents.Remove(existing);
            await _db.SaveChangesAsync(ct);
        }
    }
}
