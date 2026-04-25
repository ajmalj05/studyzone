namespace Studyzone.Application.Exams;

public interface IExamService
{
    Task<ExamDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<ExamDto>> GetAllAsync(string? classId, CancellationToken ct = default);
    Task<IReadOnlyList<ExamDto>> GetAllForClassIdsAsync(IReadOnlyList<string> classIds, CancellationToken ct = default);
    Task<IReadOnlyList<ExamDto>> GetAllForClassAndBatchIdsAsync(IReadOnlyList<string> classIds, IReadOnlyList<string> batchIds, CancellationToken ct = default);
    Task<ExamDto> CreateAsync(CreateExamRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<MarksEntryDto>> GetMarksByExamAsync(string examId, bool approvedOnly = false, CancellationToken ct = default);
    Task SaveMarksAsync(SaveMarksRequest request, CancellationToken ct = default);
    Task<int> ApproveAllPendingMarksForExamAsync(string examId, string approvedByUserId, CancellationToken ct = default);
    Task<bool> ApproveMarksEntryAsync(string marksEntryId, string approvedByUserId, CancellationToken ct = default);
    Task<bool> RejectMarksEntryAsync(string marksEntryId, string? reason, string approvedByUserId, CancellationToken ct = default);

    Task<IReadOnlyList<ExamScheduleEntryDto>> GetScheduleByExamIdAsync(string examId, CancellationToken ct = default);
    Task<IReadOnlyList<ExamScheduleEntryDto>> GetScheduleForTeacherAsync(string teacherUserId, CancellationToken ct = default);
    Task<ExamScheduleEntryDto> CreateScheduleEntryAsync(CreateExamScheduleEntryRequest request, CancellationToken ct = default);
    Task<ExamScheduleEntryDto> UpdateScheduleEntryAsync(string entryId, UpdateExamScheduleEntryRequest request, CancellationToken ct = default);
    Task DeleteScheduleEntryAsync(string entryId, CancellationToken ct = default);
}
