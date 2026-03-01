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
            ContentType = added.ContentType,
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
            ContentType = d.ContentType,
            FileSize = d.FileSize,
            UploadedAt = d.UploadedAt
        }).ToList();
    }

    public async Task<DocumentDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var d = await _repo.GetByIdAsync(guid, ct);
        if (d == null) return null;
        return new DocumentDto
        {
            Id = d.Id.ToString(),
            ApplicationId = d.ApplicationId?.ToString(),
            DocumentType = d.DocumentType,
            FileName = d.FileName,
            ContentType = d.ContentType,
            FileSize = d.FileSize,
            UploadedAt = d.UploadedAt
        };
    }

    public async Task<Stream?> GetStreamAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var doc = await _repo.GetByIdAsync(guid, ct);
        if (doc == null) return null;
        return await _storage.GetAsync(doc.FilePath, ct);
    }

    public async Task<string?> GetDownloadUrlAsync(string id, string? baseUrl, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var doc = await _repo.GetByIdAsync(guid, ct);
        if (doc == null) return null;
        var url = await _storage.GetAccessUrlAsync(doc.FilePath, TimeSpan.FromHours(1), ct);
        if (!string.IsNullOrEmpty(url)) return url;
        return string.IsNullOrEmpty(baseUrl) ? null : $"{baseUrl.TrimEnd('/')}/api/Documents/{id}/download";
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
