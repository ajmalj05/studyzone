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

    public async Task<IReadOnlyList<MarksEntry>> GetByExamIdAsync(Guid examId, CancellationToken ct = default)
    {
        return await _db.MarksEntries.AsNoTracking().Where(x => x.ExamId == examId).ToListAsync(ct);
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
            _db.MarksEntries.Update(existing);
            await _db.SaveChangesAsync(ct);
            return existing;
        }
        entry.Id = Guid.NewGuid();
        entry.CreatedAt = DateTime.UtcNow;
        _db.MarksEntries.Add(entry);
        await _db.SaveChangesAsync(ct);
        return entry;
    }
}
