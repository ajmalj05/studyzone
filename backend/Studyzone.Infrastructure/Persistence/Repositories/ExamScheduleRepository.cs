using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class ExamScheduleRepository : IExamScheduleRepository
{
    private readonly ApplicationDbContext _db;

    public ExamScheduleRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ExamScheduleEntry>> GetByExamIdAsync(Guid examId, CancellationToken ct = default)
        => await _db.ExamScheduleEntries.AsNoTracking()
            .Where(e => e.ExamId == examId)
            .OrderBy(e => e.ScheduledDate).ThenBy(e => e.StartTime)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ExamScheduleEntry>> GetByExamIdsAsync(IReadOnlyList<Guid> examIds, CancellationToken ct = default)
        => await _db.ExamScheduleEntries.AsNoTracking()
            .Where(e => examIds.Contains(e.ExamId))
            .OrderBy(e => e.ScheduledDate).ThenBy(e => e.StartTime)
            .ToListAsync(ct);

    public async Task<ExamScheduleEntry?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.ExamScheduleEntries.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task<ExamScheduleEntry> AddAsync(ExamScheduleEntry entity, CancellationToken ct = default)
    {
        _db.ExamScheduleEntries.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(ExamScheduleEntry entity, CancellationToken ct = default)
    {
        _db.ExamScheduleEntries.Update(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entry = await _db.ExamScheduleEntries.FindAsync(new object[] { id }, ct);
        if (entry != null)
        {
            _db.ExamScheduleEntries.Remove(entry);
            await _db.SaveChangesAsync(ct);
        }
    }
}
