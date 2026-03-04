using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface ISubjectRepository
{
    Task<IReadOnlyList<Subject>> GetAllAsync(CancellationToken ct = default);
    Task<Subject?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Subject>> GetByClassIdAsync(Guid classId, CancellationToken ct = default);
    Task<Subject> AddAsync(Subject entity, CancellationToken ct = default);
    Task UpdateAsync(Subject entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task SetSubjectsForClassAsync(Guid classId, IReadOnlyList<Guid> subjectIds, CancellationToken ct = default);
}
