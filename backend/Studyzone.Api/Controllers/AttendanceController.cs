using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Attendance;
using Studyzone.Application.Students;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _service;
    private readonly IBatchService _batchService;

    public AttendanceController(IAttendanceService service, IBatchService batchService)
    {
        _service = service;
        _batchService = batchService;
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<IReadOnlyList<AttendanceRecordDto>>> GetByStudent(string studentId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        var list = await _service.GetByStudentAsync(studentId, from, to, ct);
        return Ok(list);
    }

    [HttpGet("class/{classId}")]
    public async Task<ActionResult<IReadOnlyList<AttendanceRecordDto>>> GetByClassAndDate(string classId, [FromQuery] DateTime date, CancellationToken ct)
    {
        var list = await _service.GetByClassAndDateAsync(classId, date, ct);
        return Ok(list);
    }

    [HttpGet("batch/{batchId}")]
    public async Task<ActionResult<IReadOnlyList<AttendanceRecordDto>>> GetByBatchAndDate(string batchId, [FromQuery] DateTime date, CancellationToken ct)
    {
        if (User.IsInRole("Teacher") && !User.IsInRole("Admin"))
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var batch = await _batchService.GetByIdAsync(batchId, ct);
            if (batch == null) return NotFound();
            if (string.IsNullOrEmpty(currentUserId) || batch.ClassTeacherUserId != currentUserId)
                return Forbid();
        }
        var list = await _service.GetByBatchAndDateAsync(batchId, date, ct);
        return Ok(list);
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> SaveBulk([FromBody] BulkAttendanceRequest request, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(request.BatchId))
        {
            if (User.IsInRole("Teacher") && !User.IsInRole("Admin"))
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var batch = await _batchService.GetByIdAsync(request.BatchId, ct);
                if (batch == null) return NotFound();
                if (string.IsNullOrEmpty(currentUserId) || batch.ClassTeacherUserId != currentUserId)
                    return Forbid();
            }
        }
        await _service.SaveBulkAsync(request, ct);
        return NoContent();
    }

    [HttpGet("monthly-report")]
    public async Task<ActionResult<IReadOnlyList<MonthlyAttendanceReportDto>>> GetMonthlyReport([FromQuery] string? classId, [FromQuery] int year, [FromQuery] int month, CancellationToken ct)
    {
        var list = await _service.GetMonthlyReportAsync(classId, year, month, ct);
        return Ok(list);
    }

    [HttpGet("teachers")]
    public async Task<ActionResult<IReadOnlyList<TeacherAttendanceItemDto>>> GetTeachersForDate([FromQuery] DateTime date, CancellationToken ct)
    {
        var list = await _service.GetTeachersForDateAsync(date, ct);
        return Ok(list);
    }

    [HttpGet("teacher/{teacherUserId}")]
    public async Task<ActionResult<IReadOnlyList<AttendanceRecordDto>>> GetByTeacher(string teacherUserId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        var list = await _service.GetByTeacherAsync(teacherUserId, from, to, ct);
        return Ok(list);
    }

    [HttpPost("bulk-teacher")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<IActionResult> SaveBulkTeacher([FromBody] BulkTeacherAttendanceRequest request, CancellationToken ct)
    {
        await _service.SaveBulkTeacherAsync(request, ct);
        return NoContent();
    }

    /// <summary>Teacher marks their own attendance for a date (teacher portal only).</summary>
    [HttpPost("self")]
    [Authorize(Roles = "Teacher,teacher")]
    public async Task<IActionResult> SaveSelf([FromBody] TeacherSelfAttendanceRequest request, CancellationToken ct)
    {
        var teacherUserGuid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(teacherUserGuid))
            return Unauthorized();
        await _service.SaveSelfAttendanceAsync(teacherUserGuid, request.Date, request.Status, ct);
        return NoContent();
    }
}
