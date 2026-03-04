using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class SchoolExpenseRepository : ISchoolExpenseRepository
{
    private readonly ApplicationDbContext _db;

    public SchoolExpenseRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<SchoolExpense?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.SchoolExpenses.FindAsync([id], ct);
    }

    public async Task<IReadOnlyList<SchoolExpense>> GetListAsync(DateTime? dateFrom, DateTime? dateTo, string? category, CancellationToken ct = default)
    {
        var query = _db.SchoolExpenses.AsNoTracking();
        if (dateFrom.HasValue)
            query = query.Where(x => x.Date >= dateFrom.Value.Date);
        if (dateTo.HasValue)
            query = query.Where(x => x.Date <= dateTo.Value.Date);
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(x => x.Category == category.Trim());
        return await query.OrderByDescending(x => x.Date).ThenByDescending(x => x.CreatedAt).ToListAsync(ct);
    }

    public async Task<SchoolExpense> AddAsync(SchoolExpense entity, CancellationToken ct = default)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        _db.SchoolExpenses.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<SchoolExpense> UpdateAsync(SchoolExpense entity, CancellationToken ct = default)
    {
        _db.SchoolExpenses.Update(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var e = await _db.SchoolExpenses.FindAsync([id], ct);
        if (e != null)
        {
            _db.SchoolExpenses.Remove(e);
            await _db.SaveChangesAsync(ct);
        }
    }
}
