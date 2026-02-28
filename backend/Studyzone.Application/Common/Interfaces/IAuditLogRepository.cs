using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog entry, CancellationToken ct = default);
    Task<IReadOnlyList<AuditLog>> GetAsync(DateTime? from, DateTime? to, string? tableName, string? userId, int skip, int take, CancellationToken ct = default);
    Task<int> CountAsync(DateTime? from, DateTime? to, string? tableName, string? userId, CancellationToken ct = default);
}
