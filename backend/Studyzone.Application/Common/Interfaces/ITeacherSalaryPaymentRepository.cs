using TeacherSalaryPaymentEntity = Studyzone.Domain.Entities.TeacherSalaryPayment;

namespace Studyzone.Application.Common.Interfaces;

public interface ITeacherSalaryPaymentRepository
{
    Task<TeacherSalaryPaymentEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<TeacherSalaryPaymentEntity?> GetByIdWithLinesAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<TeacherSalaryPaymentEntity>> GetByTeacherAsync(Guid teacherUserId, CancellationToken ct = default);
    Task<IReadOnlyList<TeacherSalaryPaymentEntity>> GetByMonthAsync(int year, int month, CancellationToken ct = default);
    Task<bool> ExistsByTeacherAndMonthAsync(Guid teacherUserId, int year, int month, CancellationToken ct = default);
    Task<TeacherSalaryPaymentEntity> AddAsync(TeacherSalaryPaymentEntity entity, CancellationToken ct = default);
    Task<TeacherSalaryPaymentEntity> UpdateAsync(TeacherSalaryPaymentEntity entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
