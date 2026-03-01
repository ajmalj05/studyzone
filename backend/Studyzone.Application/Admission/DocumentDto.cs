namespace Studyzone.Application.Admission;

public class DocumentDto
{
    public string Id { get; set; } = string.Empty;
    public string? ApplicationId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
    /// <summary>Presigned or download URL when available (e.g. from upload response or GET url).</summary>
    public string? Url { get; set; }
}
