using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface ISchoolRepository
{
    Task<School?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<School?> GetFirstAsync(CancellationToken ct = default);
    Task<School> AddAsync(School entity, CancellationToken ct = default);
    Task UpdateAsync(School entity, CancellationToken ct = default);
}
