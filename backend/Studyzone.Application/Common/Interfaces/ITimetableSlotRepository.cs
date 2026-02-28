using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface ITimetableSlotRepository
{
    Task<TimetableSlot?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<TimetableSlot>> GetByBatchIdAsync(Guid batchId, CancellationToken ct = default);
    Task<IReadOnlyList<TimetableSlot>> GetByTeacherUserIdAsync(Guid teacherUserId, CancellationToken ct = default);
    Task<IReadOnlyList<TimetableSlot>> GetAllAsync(CancellationToken ct = default);
    Task<TimetableSlot> AddAsync(TimetableSlot entity, CancellationToken ct = default);
    Task UpdateAsync(TimetableSlot entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
