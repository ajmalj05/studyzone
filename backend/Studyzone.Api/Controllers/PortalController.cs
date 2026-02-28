using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Attendance;
using Studyzone.Application.Communication;
using Studyzone.Application.Fees;
using Studyzone.Application.Portal;
using Studyzone.Application.Timetable;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "student")]
public class PortalController : ControllerBase
{
    private readonly IPortalService _portal;

    public PortalController(IPortalService portal)
    {
        _portal = portal;
    }

    private string? GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    [HttpGet("profile")]
    public async Task<ActionResult<StudentPortalProfileDto>> GetProfile(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var dto = await _portal.GetStudentProfileAsync(userId, ct);
        if (dto == null)
            return NotFound();
        return Ok(dto);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<StudentPortalDashboardDto>> GetDashboard(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var dto = await _portal.GetStudentDashboardAsync(userId, ct);
        return Ok(dto);
    }

    [HttpGet("timetable")]
    public async Task<ActionResult<IReadOnlyList<TimetableSlotDto>>> GetTimetable(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var list = await _portal.GetStudentTimetableAsync(userId, ct);
        return Ok(list);
    }

    [HttpGet("attendance")]
    public async Task<ActionResult<IReadOnlyList<AttendanceRecordDto>>> GetAttendance([FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var list = await _portal.GetStudentAttendanceAsync(userId, from, to, ct);
        return Ok(list);
    }

    [HttpGet("fees")]
    public async Task<ActionResult<FeeLedgerDto?>> GetFees([FromQuery] string? periodFrom, [FromQuery] string? periodTo, CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var dto = await _portal.GetStudentFeeLedgerAsync(userId, periodFrom, periodTo, ct);
        if (dto == null)
            return NotFound();
        return Ok(dto);
    }

    [HttpGet("results")]
    public async Task<ActionResult<IReadOnlyList<StudentExamResultDto>>> GetResults(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var list = await _portal.GetStudentResultsAsync(userId, ct);
        return Ok(list);
    }

    [HttpGet("notices")]
    public async Task<ActionResult<IReadOnlyList<AnnouncementDto>>> GetNotices([FromQuery] int take = 50, CancellationToken ct = default)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var list = await _portal.GetStudentNoticesAsync(userId, take, ct);
        return Ok(list);
    }
}
