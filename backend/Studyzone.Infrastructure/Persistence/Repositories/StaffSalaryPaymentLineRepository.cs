using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class StaffSalaryPaymentLineRepository : IStaffSalaryPaymentLineRepository
{
    private readonly ApplicationDbContext _db;

    public StaffSalaryPaymentLineRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<StaffSalaryPaymentLine?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.StaffSalaryPaymentLines.FindAsync([id], ct);
    }

    public async Task<IReadOnlyList<StaffSalaryPaymentLine>> GetByPaymentIdAsync(Guid staffSalaryPaymentId, CancellationToken ct = default)
    {
        return await _db.StaffSalaryPaymentLines
            .AsNoTracking()
            .Where(x => x.StaffSalaryPaymentId == staffSalaryPaymentId)
            .ToListAsync(ct);
    }

    public async Task<StaffSalaryPaymentLine> AddAsync(StaffSalaryPaymentLine entity, CancellationToken ct = default)
    {
        entity.Id = Guid.NewGuid();
        _db.StaffSalaryPaymentLines.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<StaffSalaryPaymentLine> UpdateAsync(StaffSalaryPaymentLine entity, CancellationToken ct = default)
    {
        _db.StaffSalaryPaymentLines.Update(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.StaffSalaryPaymentLines.FindAsync([id], ct);
        if (e != null)
        {
            _db.StaffSalaryPaymentLines.Remove(e);
            await _db.SaveChangesAsync(ct);
        }
    }
}
