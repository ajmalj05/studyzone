namespace Studyzone.Application.Subjects;

public interface ISubjectService
{
    Task<IReadOnlyList<SubjectDto>> GetAllAsync(CancellationToken ct = default);
    Task<SubjectDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<SubjectDto>> GetByClassIdAsync(string classId, CancellationToken ct = default);
    Task<SubjectDto> CreateAsync(CreateSubjectRequest request, CancellationToken ct = default);
    Task<SubjectDto> UpdateAsync(string id, CreateSubjectRequest request, CancellationToken ct = default);
    Task DeleteAsync(string id, CancellationToken ct = default);
    Task SetSubjectsForClassAsync(string classId, SetSubjectsForClassRequest request, CancellationToken ct = default);
}
