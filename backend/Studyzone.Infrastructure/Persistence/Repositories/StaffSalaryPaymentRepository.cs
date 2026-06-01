using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class StaffSalaryPaymentRepository : IStaffSalaryPaymentRepository
{
    private readonly ApplicationDbContext _db;

    public StaffSalaryPaymentRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<StaffSalaryPayment?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.StaffSalaryPayments.FindAsync([id], ct);
    }

    public async Task<StaffSalaryPayment?> GetByIdWithLinesAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.StaffSalaryPayments
            .Include(x => x.Lines)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<IReadOnlyList<StaffSalaryPayment>> GetByStaffAsync(Guid staffUserId, CancellationToken ct = default)
    {
        return await _db.StaffSalaryPayments
            .Include(x => x.Lines)
            .AsNoTracking()
            .Where(x => x.StaffUserId == staffUserId)
            .OrderByDescending(x => x.Year).ThenByDescending(x => x.Month)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<StaffSalaryPayment>> GetByMonthAsync(int year, int month, CancellationToken ct = default)
    {
        return await _db.StaffSalaryPayments
            .Include(x => x.Lines)
            .AsNoTracking()
            .Where(x => x.Year == year && x.Month == month)
            .OrderBy(x => x.StaffUserId.ToString())
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<StaffSalaryPayment>> GetByStatusAndDateRangeAsync(string? status, int? yearFrom, int? yearTo, int? monthFrom, int? monthTo, CancellationToken ct = default)
    {
        var query = _db.StaffSalaryPayments.Include(x => x.Lines).AsNoTracking();
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
            .OrderByDescending(x => x.Year).ThenByDescending(x => x.Month).ThenBy(x => x.StaffUserId.ToString())
            .ToListAsync(ct);
    }

    public async Task<bool> ExistsByStaffAndMonthAsync(Guid staffUserId, int year, int month, CancellationToken ct = default)
    {
        return await _db.StaffSalaryPayments.AnyAsync(x => x.StaffUserId == staffUserId && x.Year == year && x.Month == month, ct);
    }

    public async Task<StaffSalaryPayment> AddAsync(StaffSalaryPayment entity, CancellationToken ct = default)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        _db.StaffSalaryPayments.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<StaffSalaryPayment> UpdateAsync(StaffSalaryPayment entity, CancellationToken ct = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _db.StaffSalaryPayments.Update(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.StaffSalaryPayments.FindAsync([id], ct);
        if (e != null)
        {
            _db.StaffSalaryPayments.Remove(e);
            await _db.SaveChangesAsync(ct);
        }
    }
}
