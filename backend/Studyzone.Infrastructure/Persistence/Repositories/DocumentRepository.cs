using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly ApplicationDbContext _db;

    public DocumentRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Document?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Documents.FindAsync(new object[] { id }, ct);
    }

    public async Task<IReadOnlyList<Document>> GetByApplicationIdAsync(Guid applicationId, CancellationToken ct = default)
    {
        return await _db.Documents.AsNoTracking().Where(x => x.ApplicationId == applicationId).OrderBy(x => x.DocumentType).ToListAsync(ct);
    }

    public async Task<Document> AddAsync(Document entity, CancellationToken ct = default)
    {
        _db.Documents.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var doc = await _db.Documents.FindAsync(new object[] { id }, ct);
        if (doc != null)
        {
            _db.Documents.Remove(doc);
            await _db.SaveChangesAsync(ct);
        }
    }
}
