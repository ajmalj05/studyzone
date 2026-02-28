using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Timetable;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimetableController : ControllerBase
{
    private readonly ITimetableService _service;

    public TimetableController(ITimetableService service)
    {
        _service = service;
    }

    [HttpGet("period-config")]
    public async Task<ActionResult<IReadOnlyList<PeriodConfigDto>>> GetPeriodConfig(CancellationToken ct)
    {
        var list = await _service.GetPeriodConfigAsync(ct);
        return Ok(list);
    }

    [HttpPost("period-config")]
    public async Task<ActionResult<PeriodConfigDto>> SavePeriodConfig([FromBody] PeriodConfigDto dto, CancellationToken ct)
    {
        var result = await _service.SavePeriodConfigAsync(dto, ct);
        return Ok(result);
    }

    [HttpGet("batch/{batchId}")]
    public async Task<ActionResult<IReadOnlyList<TimetableSlotDto>>> GetByBatch(string batchId, CancellationToken ct)
    {
        var list = await _service.GetSlotsByBatchAsync(batchId, ct);
        return Ok(list);
    }

    [HttpPost("slot")]
    public async Task<ActionResult<TimetableSlotDto>> SaveSlot([FromBody] TimetableSlotDto dto, CancellationToken ct)
    {
        var result = await _service.SaveSlotAsync(dto, ct);
        return Ok(result);
    }

    [HttpPost("batch/{batchId}/publish")]
    public async Task<IActionResult> Publish(string batchId, CancellationToken ct)
    {
        await _service.PublishTimetableAsync(batchId, ct);
        return NoContent();
    }
}
