using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class FeeChargeRepository : IFeeChargeRepository
{
    private readonly ApplicationDbContext _db;

    public FeeChargeRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<FeeCharge>> GetByStudentIdAsync(Guid studentId, string? periodFilter, CancellationToken ct = default)
    {
        var query = _db.FeeCharges.AsNoTracking().Where(x => x.StudentId == studentId);
        if (!string.IsNullOrWhiteSpace(periodFilter))
            query = query.Where(x => x.Period == periodFilter);
        return await query.OrderBy(x => x.Period).ToListAsync(ct);
    }

    public async Task<decimal> GetTotalChargesAsync(Guid studentId, string? periodFrom, string? periodTo, CancellationToken ct = default)
    {
        var query = _db.FeeCharges.AsNoTracking().Where(x => x.StudentId == studentId);
        if (!string.IsNullOrWhiteSpace(periodFrom))
            query = query.Where(x => string.Compare(x.Period, periodFrom, StringComparison.Ordinal) >= 0);
        if (!string.IsNullOrWhiteSpace(periodTo))
            query = query.Where(x => string.Compare(x.Period, periodTo, StringComparison.Ordinal) <= 0);
        return await query.SumAsync(x => x.Amount, ct);
    }

    public async Task<FeeCharge> AddAsync(FeeCharge entity, CancellationToken ct = default)
    {
        _db.FeeCharges.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }
}
