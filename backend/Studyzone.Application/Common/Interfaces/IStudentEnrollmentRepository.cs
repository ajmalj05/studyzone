using StudentEnrollmentEntity = Studyzone.Domain.Entities.StudentEnrollment;

namespace Studyzone.Application.Common.Interfaces;

public interface IStudentEnrollmentRepository
{
    Task<StudentEnrollmentEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<StudentEnrollmentEntity?> GetByStudentAndAcademicYearAsync(Guid studentId, Guid academicYearId, CancellationToken ct = default);
    Task<IReadOnlyList<StudentEnrollmentEntity>> GetByAcademicYearAsync(Guid academicYearId, Guid? classId, Guid? batchId, string? statusFilter, int skip, int take, CancellationToken ct = default);
    Task<int> CountByAcademicYearAsync(Guid academicYearId, Guid? classId, Guid? batchId, string? statusFilter, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid studentId, Guid academicYearId, CancellationToken ct = default);
    Task<StudentEnrollmentEntity?> GetCurrentForStudentAsync(Guid studentId, CancellationToken ct = default);
    Task<StudentEnrollmentEntity> AddAsync(StudentEnrollmentEntity entity, CancellationToken ct = default);
    Task<StudentEnrollmentEntity> UpdateAsync(StudentEnrollmentEntity entity, CancellationToken ct = default);
}
