using TeacherSalaryEntity = Studyzone.Domain.Entities.TeacherSalary;

namespace Studyzone.Application.Common.Interfaces;

public interface ITeacherSalaryRepository
{
    Task<TeacherSalaryEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<TeacherSalaryEntity>> GetByTeacherAsync(Guid teacherUserId, CancellationToken ct = default);
    Task<TeacherSalaryEntity?> GetCurrentForTeacherAsync(Guid teacherUserId, CancellationToken ct = default);
    Task<TeacherSalaryEntity> AddAsync(TeacherSalaryEntity entity, CancellationToken ct = default);
    Task<TeacherSalaryEntity> UpdateAsync(TeacherSalaryEntity entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
