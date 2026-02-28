using Studyzone.Application.Admission;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class DocumentService : IDocumentService
{
    private readonly IDocumentRepository _repo;
    private readonly IFileStorageService _storage;

    public DocumentService(IDocumentRepository repo, IFileStorageService storage)
    {
        _repo = repo;
        _storage = storage;
    }

    public async Task<DocumentDto> UploadAsync(string? applicationId, string documentType, Stream content, string fileName, string contentType, long fileSize, CancellationToken ct = default)
    {
        var subFolder = string.IsNullOrWhiteSpace(applicationId) ? "documents" : $"applications/{applicationId}";
        var path = await _storage.SaveAsync(content, fileName, contentType, subFolder, ct);
        var entity = new Document
        {
            Id = Guid.NewGuid(),
            ApplicationId = string.IsNullOrWhiteSpace(applicationId) || !Guid.TryParse(applicationId, out var aid) ? null : aid,
            DocumentType = documentType,
            FilePath = path,
            FileName = fileName,
            FileSize = fileSize,
            ContentType = contentType,
            UploadedAt = DateTime.UtcNow
        };
        var added = await _repo.AddAsync(entity, ct);
        return new DocumentDto
        {
            Id = added.Id.ToString(),
            ApplicationId = added.ApplicationId?.ToString(),
            DocumentType = added.DocumentType,
            FileName = added.FileName,
            FileSize = added.FileSize,
            UploadedAt = added.UploadedAt
        };
    }

    public async Task<IReadOnlyList<DocumentDto>> GetByApplicationIdAsync(string applicationId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(applicationId, out var guid)) return Array.Empty<DocumentDto>();
        var list = await _repo.GetByApplicationIdAsync(guid, ct);
        return list.Select(d => new DocumentDto
        {
            Id = d.Id.ToString(),
            ApplicationId = d.ApplicationId?.ToString(),
            DocumentType = d.DocumentType,
            FileName = d.FileName,
            FileSize = d.FileSize,
            UploadedAt = d.UploadedAt
        }).ToList();
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return;
        var doc = await _repo.GetByIdAsync(guid, ct);
        if (doc != null)
        {
            await _storage.DeleteAsync(doc.FilePath, ct);
            await _repo.DeleteAsync(guid, ct);
        }
    }
}
