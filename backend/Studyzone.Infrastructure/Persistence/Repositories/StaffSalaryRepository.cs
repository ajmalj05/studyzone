using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class StaffSalaryRepository : IStaffSalaryRepository
{
    private readonly ApplicationDbContext _db;

    public StaffSalaryRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<StaffSalary?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.StaffSalaries.FindAsync([id], ct);
    }

    public async Task<IReadOnlyList<StaffSalary>> GetByStaffAsync(Guid staffUserId, CancellationToken ct = default)
    {
        return await _db.StaffSalaries.AsNoTracking()
            .Where(x => x.StaffUserId == staffUserId)
            .OrderByDescending(x => x.EffectiveFrom)
            .ToListAsync(ct);
    }

    public async Task<StaffSalary?> GetCurrentForStaffAsync(Guid staffUserId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow.Date;
        return await _db.StaffSalaries.AsNoTracking()
            .Where(x => x.StaffUserId == staffUserId && x.EffectiveFrom <= now && (x.EffectiveTo == null || x.EffectiveTo >= now))
            .OrderByDescending(x => x.EffectiveFrom)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<StaffSalary> AddAsync(StaffSalary entity, CancellationToken ct = default)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        _db.StaffSalaries.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<StaffSalary> UpdateAsync(StaffSalary entity, CancellationToken ct = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _db.StaffSalaries.Update(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.StaffSalaries.FindAsync([id], ct);
        if (e != null)
        {
            _db.StaffSalaries.Remove(e);
            await _db.SaveChangesAsync(ct);
        }
    }
}
