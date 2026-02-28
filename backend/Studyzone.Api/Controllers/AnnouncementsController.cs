using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Communication;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService _service;

    public AnnouncementsController(IAnnouncementService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<AnnouncementDto>> Create([FromBody] CreateAnnouncementRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var dto = await _service.CreateAsync(request, userId, ct);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AnnouncementDto>>> GetAll([FromQuery] int skip = 0, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        var list = await _service.GetAllAsync(skip, take, ct);
        return Ok(list);
    }

    [HttpGet("notice-board")]
    public async Task<ActionResult<IReadOnlyList<AnnouncementDto>>> GetNoticeBoard([FromQuery] string? classId, [FromQuery] string? userId, [FromQuery] string? studentId, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        Guid? cid = string.IsNullOrWhiteSpace(classId) || !Guid.TryParse(classId, out var c) ? null : c;
        Guid? uid = string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var u) ? null : u;
        Guid? sid = string.IsNullOrWhiteSpace(studentId) || !Guid.TryParse(studentId, out var s) ? null : s;
        var list = await _service.GetNoticeBoardAsync(cid, uid, sid, take, ct);
        return Ok(list);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        var ok = await _service.DeleteAsync(id, ct);
        if (!ok) return NotFound();
        return NoContent();
    }
}
