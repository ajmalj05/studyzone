using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class TeacherSalaryPaymentRepository : ITeacherSalaryPaymentRepository
{
    private readonly ApplicationDbContext _db;

    public TeacherSalaryPaymentRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<TeacherSalaryPayment?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.TeacherSalaryPayments.FindAsync([id], ct);
    }

    public async Task<TeacherSalaryPayment?> GetByIdWithLinesAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.TeacherSalaryPayments
            .Include(x => x.Lines)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<IReadOnlyList<TeacherSalaryPayment>> GetByTeacherAsync(Guid teacherUserId, CancellationToken ct = default)
    {
        return await _db.TeacherSalaryPayments
            .Include(x => x.Lines)
            .AsNoTracking()
            .Where(x => x.TeacherUserId == teacherUserId)
            .OrderByDescending(x => x.Year).ThenByDescending(x => x.Month)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<TeacherSalaryPayment>> GetByMonthAsync(int year, int month, CancellationToken ct = default)
    {
        return await _db.TeacherSalaryPayments
            .Include(x => x.Lines)
            .AsNoTracking()
            .Where(x => x.Year == year && x.Month == month)
            .OrderBy(x => x.TeacherUserId.ToString())
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<TeacherSalaryPayment>> GetByStatusAndDateRangeAsync(string? status, int? yearFrom, int? yearTo, int? monthFrom, int? monthTo, CancellationToken ct = default)
    {
        var query = _db.TeacherSalaryPayments.Include(x => x.Lines).AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status.Trim());
        if (yearFrom.HasValue)
        {
            var periodFrom = yearFrom.Value * 12 + (monthFrom ?? 1);
            query = query.Where(x => (x.Year * 12 + x.Month) >= periodFrom);
        }
        if (yearTo.HasValue)
        {
            var periodTo = yearTo.Value * 12 + (monthTo ?? 12);
            query = query.Where(x => (x.Year * 12 + x.Month) <= periodTo);
        }
        return await query
            .OrderByDescending(x => x.Year).ThenByDescending(x => x.Month).ThenBy(x => x.TeacherUserId.ToString())
            .ToListAsync(ct);
    }

    public async Task<bool> ExistsByTeacherAndMonthAsync(Guid teacherUserId, int year, int month, CancellationToken ct = default)
    {
        return await _db.TeacherSalaryPayments.AnyAsync(x => x.TeacherUserId == teacherUserId && x.Year == year && x.Month == month, ct);
    }

    public async Task<TeacherSalaryPayment> AddAsync(TeacherSalaryPayment entity, CancellationToken ct = default)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        _db.TeacherSalaryPayments.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<TeacherSalaryPayment> UpdateAsync(TeacherSalaryPayment entity, CancellationToken ct = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _db.TeacherSalaryPayments.Update(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.TeacherSalaryPayments.FindAsync([id], ct);
        if (e != null)
        {
            _db.TeacherSalaryPayments.Remove(e);
            await _db.SaveChangesAsync(ct);
        }
    }
}
