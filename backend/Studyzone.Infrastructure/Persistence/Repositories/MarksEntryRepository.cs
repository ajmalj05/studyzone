using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class MarksEntryRepository : IMarksEntryRepository
{
    private readonly ApplicationDbContext _db;

    public MarksEntryRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<MarksEntry>> GetByExamIdAsync(Guid examId, bool approvedOnly = false, CancellationToken ct = default)
    {
        var q = _db.MarksEntries.AsNoTracking().Where(x => x.ExamId == examId);
        if (approvedOnly)
            q = q.Where(x => x.Status == MarksEntryStatuses.Approved);
        return await q.ToListAsync(ct);
    }

    public async Task<MarksEntry?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.MarksEntries.FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<MarksEntry?> GetAsync(Guid examId, Guid studentId, string subject, CancellationToken ct = default)
    {
        return await _db.MarksEntries.FirstOrDefaultAsync(x => x.ExamId == examId && x.StudentId == studentId && x.Subject == subject, ct);
    }

    public async Task<MarksEntry> AddOrUpdateAsync(MarksEntry entry, CancellationToken ct = default)
    {
        var existing = await GetAsync(entry.ExamId, entry.StudentId, entry.Subject, ct);
        if (existing != null)
        {
            existing.MarksObtained = entry.MarksObtained;
            existing.MaxMarks = entry.MaxMarks;
            existing.Status = MarksEntryStatuses.Pending;
            existing.ApprovedAt = null;
            existing.ApprovedByUserId = null;
            existing.RejectionReason = null;
            _db.MarksEntries.Update(existing);
            await _db.SaveChangesAsync(ct);
            return existing;
        }

        entry.Id = Guid.NewGuid();
        entry.CreatedAt = DateTime.UtcNow;
        entry.Status = MarksEntryStatuses.Pending;
        entry.ApprovedAt = null;
        entry.ApprovedByUserId = null;
        entry.RejectionReason = null;
        _db.MarksEntries.Add(entry);
        await _db.SaveChangesAsync(ct);
        return entry;
    }

    public async Task<int> ApproveAllPendingForExamAsync(Guid examId, Guid approvedByUserId, CancellationToken ct = default)
    {
        var rows = await _db.MarksEntries
            .Where(x => x.ExamId == examId && x.Status == MarksEntryStatuses.Pending)
            .ToListAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var r in rows)
        {
            r.Status = MarksEntryStatuses.Approved;
            r.ApprovedAt = now;
            r.ApprovedByUserId = approvedByUserId;
            r.RejectionReason = null;
        }

        if (rows.Count > 0)
            await _db.SaveChangesAsync(ct);
        return rows.Count;
    }

    public async Task<bool> ApproveEntryAsync(Guid entryId, Guid approvedByUserId, CancellationToken ct = default)
    {
        var row = await GetByIdAsync(entryId, ct);
        if (row == null || row.Status != MarksEntryStatuses.Pending)
            return false;
        row.Status = MarksEntryStatuses.Approved;
        row.ApprovedAt = DateTime.UtcNow;
        row.ApprovedByUserId = approvedByUserId;
        row.RejectionReason = null;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RejectEntryAsync(Guid entryId, Guid approvedByUserId, string? reason, CancellationToken ct = default)
    {
        var row = await GetByIdAsync(entryId, ct);
        if (row == null || row.Status != MarksEntryStatuses.Pending)
            return false;
        row.Status = MarksEntryStatuses.Rejected;
        row.ApprovedAt = null;
        row.ApprovedByUserId = approvedByUserId;
        row.RejectionReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
