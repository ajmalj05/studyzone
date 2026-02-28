namespace Studyzone.Application.Administration;

public interface IAuditLogService
{
    Task LogAsync(string? userId, string? userName, string tableName, string action, string? entityId, string? details, CancellationToken ct = default);
    Task<(IReadOnlyList<AuditLogEntryDto> Items, int Total)> QueryAsync(AuditLogQueryRequest request, CancellationToken ct = default);
}
