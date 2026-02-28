namespace Studyzone.Domain.Entities;

public class Document
{
    public Guid Id { get; set; }
    public Guid? ApplicationId { get; set; }
    public Guid? EnquiryId { get; set; }
    public string DocumentType { get; set; } = string.Empty; // BirthCertificate, MarkSheet, TransferCertificate, IdProof, Photo
    public string FilePath { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}
