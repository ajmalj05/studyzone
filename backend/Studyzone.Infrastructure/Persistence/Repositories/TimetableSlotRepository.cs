using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class TimetableSlotRepository : ITimetableSlotRepository
{
    private readonly ApplicationDbContext _db;

    public TimetableSlotRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<TimetableSlot?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.TimetableSlots.FindAsync(new object[] { id }, ct);
    }

    public async Task<IReadOnlyList<TimetableSlot>> GetByBatchIdAsync(Guid batchId, CancellationToken ct = default)
    {
        return await _db.TimetableSlots.AsNoTracking().Where(x => x.BatchId == batchId).OrderBy(x => x.DayOfWeek).ThenBy(x => x.PeriodOrder).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<TimetableSlot>> GetByTeacherUserIdAsync(Guid teacherUserId, CancellationToken ct = default)
    {
        return await _db.TimetableSlots.AsNoTracking()
            .Where(x => x.TeacherUserId == teacherUserId)
            .OrderBy(x => x.DayOfWeek).ThenBy(x => x.PeriodOrder)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<TimetableSlot>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.TimetableSlots.AsNoTracking().ToListAsync(ct);
    }

    public async Task<TimetableSlot> AddAsync(TimetableSlot entity, CancellationToken ct = default)
    {
        _db.TimetableSlots.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(TimetableSlot entity, CancellationToken ct = default)
    {
        _db.TimetableSlots.Update(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var slot = await _db.TimetableSlots.FindAsync(new object[] { id }, ct);
        if (slot != null)
        {
            _db.TimetableSlots.Remove(slot);
            await _db.SaveChangesAsync(ct);
        }
    }
}
