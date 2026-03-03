using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IBatchRepository
{
    Task<Batch?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Batch?> GetByClassTeacherUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Batch?> GetByClassTeacherUserIdAndAcademicYearAsync(Guid userId, Guid academicYearId, CancellationToken ct = default);
    Task<IReadOnlyList<Batch>> GetByClassIdAsync(Guid classId, CancellationToken ct = default);
    Task<IReadOnlyList<Batch>> GetByClassIdAndAcademicYearAsync(Guid classId, Guid academicYearId, CancellationToken ct = default);
    Task<IReadOnlyList<Batch>> GetAllAsync(CancellationToken ct = default);
    Task<IReadOnlyList<Batch>> GetByAcademicYearAsync(Guid academicYearId, CancellationToken ct = default);
    Task<Batch> AddAsync(Batch entity, CancellationToken ct = default);
    Task UpdateAsync(Batch entity, CancellationToken ct = default);
}
