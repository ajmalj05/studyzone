using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IStudentParentRepository
{
    Task<IReadOnlyList<StudentParent>> GetByParentUserIdAsync(Guid parentUserId, CancellationToken ct = default);
    Task<IReadOnlyList<StudentParent>> GetByStudentIdAsync(Guid studentId, CancellationToken ct = default);
    Task<StudentParent?> GetAsync(Guid studentId, Guid parentUserId, CancellationToken ct = default);
    Task<StudentParent> AddAsync(StudentParent entity, CancellationToken ct = default);
    Task RemoveAsync(Guid studentId, Guid parentUserId, CancellationToken ct = default);
}
