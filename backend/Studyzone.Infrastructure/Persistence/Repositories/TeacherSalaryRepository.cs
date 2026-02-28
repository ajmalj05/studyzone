using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class TeacherSalaryRepository : ITeacherSalaryRepository
{
    private readonly ApplicationDbContext _db;

    public TeacherSalaryRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<TeacherSalary?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.TeacherSalaries.FindAsync([id], ct);
    }

    public async Task<IReadOnlyList<TeacherSalary>> GetByTeacherAsync(Guid teacherUserId, CancellationToken ct = default)
    {
        return await _db.TeacherSalaries.AsNoTracking()
            .Where(x => x.TeacherUserId == teacherUserId)
            .OrderByDescending(x => x.EffectiveFrom)
            .ToListAsync(ct);
    }

    public async Task<TeacherSalary?> GetCurrentForTeacherAsync(Guid teacherUserId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow.Date;
        return await _db.TeacherSalaries.AsNoTracking()
            .Where(x => x.TeacherUserId == teacherUserId && x.EffectiveFrom <= now && (x.EffectiveTo == null || x.EffectiveTo >= now))
            .OrderByDescending(x => x.EffectiveFrom)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<TeacherSalary> AddAsync(TeacherSalary entity, CancellationToken ct = default)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        _db.TeacherSalaries.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<TeacherSalary> UpdateAsync(TeacherSalary entity, CancellationToken ct = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _db.TeacherSalaries.Update(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.TeacherSalaries.FindAsync([id], ct);
        if (e != null)
        {
            _db.TeacherSalaries.Remove(e);
            await _db.SaveChangesAsync(ct);
        }
    }
}
