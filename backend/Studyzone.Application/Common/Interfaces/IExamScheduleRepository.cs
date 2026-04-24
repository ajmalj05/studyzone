using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IExamScheduleRepository
{
    Task<IReadOnlyList<ExamScheduleEntry>> GetByExamIdAsync(Guid examId, CancellationToken ct = default);
    Task<IReadOnlyList<ExamScheduleEntry>> GetByExamIdsAsync(IReadOnlyList<Guid> examIds, CancellationToken ct = default);
    Task<ExamScheduleEntry?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ExamScheduleEntry> AddAsync(ExamScheduleEntry entity, CancellationToken ct = default);
    Task UpdateAsync(ExamScheduleEntry entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
