using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class EnquiryRepository : IEnquiryRepository
{
    private readonly ApplicationDbContext _db;

    public EnquiryRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Enquiry?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Enquiries.FindAsync(new object[] { id }, ct);
    }

    public async Task<IReadOnlyList<Enquiry>> GetAllAsync(string? statusFilter, int skip, int take, CancellationToken ct = default)
    {
        var query = _db.Enquiries.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(statusFilter))
            query = query.Where(x => x.Status == statusFilter);
        return await query.OrderByDescending(x => x.CreatedAt).Skip(skip).Take(take).ToListAsync(ct);
    }

    public async Task<int> CountAsync(string? statusFilter, CancellationToken ct = default)
    {
        var query = _db.Enquiries.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(statusFilter))
            query = query.Where(x => x.Status == statusFilter);
        return await query.CountAsync(ct);
    }

    public async Task<Enquiry> AddAsync(Enquiry entity, CancellationToken ct = default)
    {
        _db.Enquiries.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Enquiry entity, CancellationToken ct = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _db.Enquiries.Update(entity);
        await _db.SaveChangesAsync(ct);
    }
}
