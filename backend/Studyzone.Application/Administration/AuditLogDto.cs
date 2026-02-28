namespace Studyzone.Application.Administration;

public class AuditLogEntryDto
{
    public string Id { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public DateTime Timestamp { get; set; }
    public string? Details { get; set; }
}

public class AuditLogQueryRequest
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public string? TableName { get; set; }
    public string? UserId { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; } = 50;
}
