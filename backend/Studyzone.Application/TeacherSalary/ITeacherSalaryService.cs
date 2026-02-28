namespace Studyzone.Application.TeacherSalary;

public interface ITeacherSalaryService
{
    Task<TeacherSalaryDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<TeacherSalaryDto>> GetByTeacherAsync(string teacherUserId, CancellationToken ct = default);
    Task<TeacherSalaryDto?> GetCurrentForTeacherAsync(string teacherUserId, CancellationToken ct = default);
    Task<TeacherSalaryDto> CreateAsync(CreateTeacherSalaryRequest request, CancellationToken ct = default);
    Task<TeacherSalaryDto> UpdateAsync(string id, UpdateTeacherSalaryRequest request, CancellationToken ct = default);
    Task DeleteAsync(string id, CancellationToken ct = default);
}
