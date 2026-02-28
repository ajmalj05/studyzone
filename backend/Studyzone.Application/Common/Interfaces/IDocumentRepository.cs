using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IDocumentRepository
{
    Task<Document?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Document>> GetByApplicationIdAsync(Guid applicationId, CancellationToken ct = default);
    Task<Document> AddAsync(Document entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
