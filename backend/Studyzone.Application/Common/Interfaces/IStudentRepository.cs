using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IStudentRepository
{
    Task<Student?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Student?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Student?> GetByAdmissionNumberAsync(string admissionNumber, CancellationToken ct = default);
    Task<Student> AddAsync(Student entity, CancellationToken ct = default);
    Task UpdateAsync(Student entity, CancellationToken ct = default);
}
