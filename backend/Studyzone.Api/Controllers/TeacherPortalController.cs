using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Portal;
using Studyzone.Application.Timetable;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Teacher,teacher")]
public class TeacherPortalController : ControllerBase
{
    private readonly IPortalService _portal;

    public TeacherPortalController(IPortalService portal)
    {
        _portal = portal;
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet("dashboard")]
    public async Task<ActionResult<TeacherPortalDashboardDto>> GetDashboard(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var dto = await _portal.GetTeacherDashboardAsync(userId, ct);
        return Ok(dto);
    }

    [HttpGet("timetable")]
    public async Task<ActionResult<IReadOnlyList<TimetableSlotDto>>> GetTimetable(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var list = await _portal.GetTeacherTimetableAsync(userId, ct);
        return Ok(list);
    }

    [HttpGet("assigned-class-ids")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetAssignedClassIds(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var list = await _portal.GetTeacherAssignedClassIdsAsync(userId, ct);
        return Ok(list);
    }

    [HttpGet("assigned-batches")]
    public async Task<ActionResult<IReadOnlyList<TeacherAssignedBatchDto>>> GetAssignedBatches(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var list = await _portal.GetTeacherAssignedBatchesAsync(userId, ct);
        return Ok(list);
    }
}
