namespace Studyzone.Application.Admission;

public interface IDocumentService
{
    Task<DocumentDto> UploadAsync(string? applicationId, string documentType, Stream content, string fileName, string contentType, long fileSize, CancellationToken ct = default);
    Task<IReadOnlyList<DocumentDto>> GetByApplicationIdAsync(string applicationId, CancellationToken ct = default);
    Task DeleteAsync(string id, CancellationToken ct = default);
}
