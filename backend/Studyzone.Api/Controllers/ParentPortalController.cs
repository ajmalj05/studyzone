using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.ParentPortal;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Parent,parent")]
public class ParentPortalController : ControllerBase
{
    private readonly IParentPortalService _service;

    public ParentPortalController(IParentPortalService service)
    {
        _service = service;
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet("dashboard")]
    public async Task<ActionResult<ParentDashboardDto>> GetDashboard(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var dto = await _service.GetDashboardAsync(userId, ct);
        return Ok(dto);
    }

    [HttpGet("my-children")]
    public async Task<ActionResult<IReadOnlyList<ParentChildDto>>> GetMyChildren(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var list = await _service.GetMyChildrenAsync(userId, ct);
        return Ok(list);
    }

    [HttpGet("children/{studentId}/attendance")]
    public async Task<ActionResult<IReadOnlyList<object>>> GetChildAttendance(string studentId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var list = await _service.GetChildAttendanceAsync(userId, studentId, from, to, ct);
        return Ok(list);
    }

    [HttpGet("children/{studentId}/fees")]
    public async Task<ActionResult<object>> GetChildFees(string studentId, [FromQuery] string? periodFrom, [FromQuery] string? periodTo, CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var dto = await _service.GetChildFeesAsync(userId, studentId, periodFrom, periodTo, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpGet("children/{studentId}/results")]
    public async Task<ActionResult<IReadOnlyList<object>>> GetChildResults(string studentId, CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var list = await _service.GetChildResultsAsync(userId, studentId, ct);
        return Ok(list);
    }

    [HttpGet("children/{studentId}/timetable")]
    public async Task<ActionResult<IReadOnlyList<object>>> GetChildTimetable(string studentId, CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var list = await _service.GetChildTimetableAsync(userId, studentId, ct);
        return Ok(list);
    }

    [HttpGet("announcements")]
    public async Task<ActionResult<IReadOnlyList<object>>> GetAnnouncements([FromQuery] int take = 50, CancellationToken ct = default)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var list = await _service.GetAnnouncementsAsync(userId, take, ct);
        return Ok(list);
    }
}
