using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class TeacherSalaryPaymentLineRepository : ITeacherSalaryPaymentLineRepository
{
    private readonly ApplicationDbContext _db;

    public TeacherSalaryPaymentLineRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<TeacherSalaryPaymentLine?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.TeacherSalaryPaymentLines.FindAsync([id], ct);
    }

    public async Task<IReadOnlyList<TeacherSalaryPaymentLine>> GetByPaymentIdAsync(Guid teacherSalaryPaymentId, CancellationToken ct = default)
    {
        return await _db.TeacherSalaryPaymentLines
            .AsNoTracking()
            .Where(x => x.TeacherSalaryPaymentId == teacherSalaryPaymentId)
            .ToListAsync(ct);
    }

    public async Task<TeacherSalaryPaymentLine> AddAsync(TeacherSalaryPaymentLine entity, CancellationToken ct = default)
    {
        entity.Id = Guid.NewGuid();
        _db.TeacherSalaryPaymentLines.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<TeacherSalaryPaymentLine> UpdateAsync(TeacherSalaryPaymentLine entity, CancellationToken ct = default)
    {
        _db.TeacherSalaryPaymentLines.Update(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.TeacherSalaryPaymentLines.FindAsync([id], ct);
        if (e != null)
        {
            _db.TeacherSalaryPaymentLines.Remove(e);
            await _db.SaveChangesAsync(ct);
        }
    }
}
