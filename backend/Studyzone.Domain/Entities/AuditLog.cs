namespace Studyzone.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Created, Updated, Deleted
    public string? EntityId { get; set; }
    public DateTime Timestamp { get; set; }
    public string? Details { get; set; }
}
