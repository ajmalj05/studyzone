using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IExamRepository
{
    Task<Exam?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Exam>> GetAllAsync(Guid? classId, CancellationToken ct = default);
    Task<Exam> AddAsync(Exam entity, CancellationToken ct = default);
}

public interface IMarksEntryRepository
{
    Task<IReadOnlyList<MarksEntry>> GetByExamIdAsync(Guid examId, CancellationToken ct = default);
    Task<MarksEntry?> GetAsync(Guid examId, Guid studentId, string subject, CancellationToken ct = default);
    Task<MarksEntry> AddOrUpdateAsync(MarksEntry entry, CancellationToken ct = default);
}
