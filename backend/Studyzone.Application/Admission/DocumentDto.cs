namespace Studyzone.Application.Admission;

public class DocumentDto
{
    public string Id { get; set; } = string.Empty;
    public string? ApplicationId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
}
