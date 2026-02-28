using Studyzone.Application.Administration;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _repo;

    public AuditLogService(IAuditLogRepository repo)
    {
        _repo = repo;
    }

    public async Task LogAsync(string? userId, string? userName, string tableName, string action, string? entityId, string? details, CancellationToken ct = default)
    {
        var entry = new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var uid) ? null : uid,
            UserName = userName,
            TableName = tableName,
            Action = action,
            EntityId = entityId,
            Timestamp = DateTime.UtcNow,
            Details = details
        };
        await _repo.AddAsync(entry, ct);
    }

    public async Task<(IReadOnlyList<AuditLogEntryDto> Items, int Total)> QueryAsync(AuditLogQueryRequest request, CancellationToken ct = default)
    {
        var items = await _repo.GetAsync(request.From, request.To, request.TableName, request.UserId, request.Skip, request.Take, ct);
        var total = await _repo.CountAsync(request.From, request.To, request.TableName, request.UserId, ct);
        var dtos = items.Select(e => new AuditLogEntryDto
        {
            Id = e.Id.ToString(),
            UserId = e.UserId?.ToString(),
            UserName = e.UserName,
            TableName = e.TableName,
            Action = e.Action,
            EntityId = e.EntityId,
            Timestamp = e.Timestamp,
            Details = e.Details
        }).ToList();
        return (dtos, total);
    }
}
