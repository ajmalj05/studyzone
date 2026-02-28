namespace Studyzone.Application.Exams;

public interface IExamService
{
    Task<ExamDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<ExamDto>> GetAllAsync(string? classId, CancellationToken ct = default);
    Task<ExamDto> CreateAsync(CreateExamRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<MarksEntryDto>> GetMarksByExamAsync(string examId, CancellationToken ct = default);
    Task SaveMarksAsync(SaveMarksRequest request, CancellationToken ct = default);
}
