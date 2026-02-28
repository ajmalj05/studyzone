using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface ISiblingGroupRepository
{
    Task<SiblingGroup?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<SiblingGroup> AddAsync(SiblingGroup entity, CancellationToken ct = default);
}
