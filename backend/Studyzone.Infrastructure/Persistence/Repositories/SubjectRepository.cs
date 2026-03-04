using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class SubjectRepository : ISubjectRepository
{
    private readonly ApplicationDbContext _db;

    public SubjectRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Subject>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Subjects.AsNoTracking().OrderBy(x => x.Name).ToListAsync(ct);
    }

    public async Task<Subject?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Subjects.FindAsync(new object[] { id }, ct);
    }

    public async Task<IReadOnlyList<Subject>> GetByClassIdAsync(Guid classId, CancellationToken ct = default)
    {
        var subjectIds = await _db.ClassSubjects
            .AsNoTracking()
            .Where(x => x.ClassId == classId)
            .Select(x => x.SubjectId)
            .ToListAsync(ct);
        if (subjectIds.Count == 0)
            return Array.Empty<Subject>();
        return await _db.Subjects
            .AsNoTracking()
            .Where(x => subjectIds.Contains(x.Id))
            .OrderBy(x => x.Name)
            .ToListAsync(ct);
    }

    public async Task<Subject> AddAsync(Subject entity, CancellationToken ct = default)
    {
        if (entity.Id == default)
            entity.Id = Guid.NewGuid();
        if (entity.CreatedAt == default)
            entity.CreatedAt = DateTime.UtcNow;
        _db.Subjects.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Subject entity, CancellationToken ct = default)
    {
        _db.Subjects.Update(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Subjects.FindAsync(new object[] { id }, ct);
        if (entity != null)
        {
            _db.Subjects.Remove(entity);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task SetSubjectsForClassAsync(Guid classId, IReadOnlyList<Guid> subjectIds, CancellationToken ct = default)
    {
        var existing = await _db.ClassSubjects.Where(x => x.ClassId == classId).ToListAsync(ct);
        _db.ClassSubjects.RemoveRange(existing);
        foreach (var subjectId in subjectIds.Distinct())
        {
            _db.ClassSubjects.Add(new ClassSubject { ClassId = classId, SubjectId = subjectId });
        }
        await _db.SaveChangesAsync(ct);
    }
}
