namespace Studyzone.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(Stream content, string fileName, string contentType, string subFolder, CancellationToken ct = default);
    Task<Stream?> GetAsync(string path, CancellationToken ct = default);
    Task<bool> DeleteAsync(string path, CancellationToken ct = default);
    /// <summary>Returns a URL to access the file (e.g. presigned for MinIO), or null if not supported (caller may use download endpoint).</summary>
    Task<string?> GetAccessUrlAsync(string path, TimeSpan? expiry = null, CancellationToken ct = default);
}
