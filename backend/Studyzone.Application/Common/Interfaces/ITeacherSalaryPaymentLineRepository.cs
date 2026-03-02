using TeacherSalaryPaymentLineEntity = Studyzone.Domain.Entities.TeacherSalaryPaymentLine;

namespace Studyzone.Application.Common.Interfaces;

public interface ITeacherSalaryPaymentLineRepository
{
    Task<TeacherSalaryPaymentLineEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<TeacherSalaryPaymentLineEntity>> GetByPaymentIdAsync(Guid teacherSalaryPaymentId, CancellationToken ct = default);
    Task<TeacherSalaryPaymentLineEntity> AddAsync(TeacherSalaryPaymentLineEntity entity, CancellationToken ct = default);
    Task<TeacherSalaryPaymentLineEntity> UpdateAsync(TeacherSalaryPaymentLineEntity entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
