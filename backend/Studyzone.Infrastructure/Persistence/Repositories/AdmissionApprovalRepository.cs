using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class AdmissionApprovalRepository : IAdmissionApprovalRepository
{
    private readonly ApplicationDbContext _db;

    public AdmissionApprovalRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<AdmissionApproval?> GetByApplicationIdAsync(Guid applicationId, CancellationToken ct = default)
    {
        return await _db.AdmissionApprovals.AsNoTracking().FirstOrDefaultAsync(x => x.ApplicationId == applicationId, ct);
    }

    public async Task<IReadOnlyList<AdmissionApproval>> GetPendingAsync(int skip, int take, CancellationToken ct = default)
    {
        return await _db.AdmissionApprovals
            .AsNoTracking()
            .Where(x => x.Status == "Pending")
            .OrderBy(x => x.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync(ct);
    }

    public async Task<int> CountPendingAsync(CancellationToken ct = default)
    {
        return await _db.AdmissionApprovals.CountAsync(x => x.Status == "Pending", ct);
    }

    public async Task<int> CountApprovedInRangeAsync(DateTime from, DateTime to, CancellationToken ct = default)
    {
        return await _db.AdmissionApprovals.CountAsync(x =>
            x.Status == "Approved" && x.ApprovedAt >= from && x.ApprovedAt <= to, ct);
    }

    public async Task<AdmissionApproval> AddAsync(AdmissionApproval entity, CancellationToken ct = default)
    {
        _db.AdmissionApprovals.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(AdmissionApproval entity, CancellationToken ct = default)
    {
        _db.AdmissionApprovals.Update(entity);
        await _db.SaveChangesAsync(ct);
    }
}
