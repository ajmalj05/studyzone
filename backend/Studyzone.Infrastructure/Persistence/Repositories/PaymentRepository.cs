using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly ApplicationDbContext _db;

    public PaymentRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Payment?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Payments.FindAsync(new object[] { id }, ct);
    }

    public async Task<IReadOnlyList<Payment>> GetByStudentIdAsync(Guid studentId, DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var query = _db.Payments.AsNoTracking().Where(x => x.StudentId == studentId);
        if (from.HasValue)
            query = query.Where(x => x.PaidAt >= from.Value);
        if (to.HasValue)
            query = query.Where(x => x.PaidAt <= to.Value);
        return await query.OrderByDescending(x => x.PaidAt).ToListAsync(ct);
    }

    public async Task<decimal> GetTotalPaymentsAsync(Guid studentId, DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var query = _db.Payments.AsNoTracking().Where(x => x.StudentId == studentId);
        if (from.HasValue)
            query = query.Where(x => x.PaidAt >= from.Value);
        if (to.HasValue)
            query = query.Where(x => x.PaidAt <= to.Value);
        return await query.SumAsync(x => x.Amount, ct);
    }

    public async Task<decimal> GetTotalRevenueAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var query = _db.Payments.AsNoTracking();
        if (from.HasValue)
            query = query.Where(x => x.PaidAt >= from.Value);
        if (to.HasValue)
            query = query.Where(x => x.PaidAt <= to.Value);
        return await query.SumAsync(x => x.Amount, ct);
    }

    public async Task<Payment> AddAsync(Payment entity, CancellationToken ct = default)
    {
        _db.Payments.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }
}
