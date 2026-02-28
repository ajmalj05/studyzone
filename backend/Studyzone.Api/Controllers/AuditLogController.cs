using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Administration;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditLogController : ControllerBase
{
    private readonly IAuditLogService _service;

    public AuditLogController(IAuditLogService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<AuditLogResponse>> Query([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? tableName, [FromQuery] string? userId, [FromQuery] int skip = 0, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        var request = new AuditLogQueryRequest { From = from, To = to, TableName = tableName, UserId = userId, Skip = skip, Take = take };
        var (items, total) = await _service.QueryAsync(request, ct);
        return Ok(new AuditLogResponse { Items = items, Total = total });
    }
}

public class AuditLogResponse
{
    public IReadOnlyList<AuditLogEntryDto> Items { get; set; } = Array.Empty<AuditLogEntryDto>();
    public int Total { get; set; }
}
