namespace Studyzone.Domain.Entities;

public class PortalRequest
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = string.Empty; // student, teacher
    public string RequestType { get; set; } = string.Empty; // Leave Request, Fee Issue, etc.
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public string? AdminComment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
