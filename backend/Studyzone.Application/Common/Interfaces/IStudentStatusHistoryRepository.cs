using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IStudentStatusHistoryRepository
{
    Task<IReadOnlyList<StudentStatusHistory>> GetByStudentIdAsync(Guid studentId, CancellationToken ct = default);
    Task AddAsync(StudentStatusHistory entity, CancellationToken ct = default);
}
