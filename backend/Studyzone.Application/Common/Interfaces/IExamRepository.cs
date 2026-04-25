using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IExamRepository
{
    Task<Exam?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Exam>> GetAllAsync(Guid? classId, CancellationToken ct = default);
    Task<IReadOnlyList<Exam>> GetAllForClassIdsAsync(IReadOnlyList<Guid> classIds, CancellationToken ct = default);
    Task<IReadOnlyList<Exam>> GetAllForClassAndBatchIdsAsync(IReadOnlyList<Guid> classIds, IReadOnlyList<Guid> batchIds, CancellationToken ct = default);
    Task<Exam> AddAsync(Exam entity, CancellationToken ct = default);
    Task<IReadOnlyList<ExamClass>> GetExamClassesByExamIdAsync(Guid examId, CancellationToken ct = default);
    Task<IReadOnlyList<ExamClass>> GetExamClassesByExamIdsAsync(IReadOnlyList<Guid> examIds, CancellationToken ct = default);
    Task AddExamClassesAsync(IReadOnlyList<ExamClass> links, CancellationToken ct = default);
}

public interface IMarksEntryRepository
{
    Task<IReadOnlyList<MarksEntry>> GetByExamIdAsync(Guid examId, bool approvedOnly = false, CancellationToken ct = default);
    Task<MarksEntry?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<MarksEntry?> GetAsync(Guid examId, Guid studentId, string subject, CancellationToken ct = default);
    Task<MarksEntry> AddOrUpdateAsync(MarksEntry entry, CancellationToken ct = default);
    Task<int> ApproveAllPendingForExamAsync(Guid examId, Guid approvedByUserId, CancellationToken ct = default);
    Task<bool> ApproveEntryAsync(Guid entryId, Guid approvedByUserId, CancellationToken ct = default);
    Task<bool> RejectEntryAsync(Guid entryId, Guid approvedByUserId, string? reason, CancellationToken ct = default);
}
