using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Exams;
using Studyzone.Application.Portal;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExamsController : ControllerBase
{
    private readonly IExamService _service;
    private readonly IPortalService _portal;

    public ExamsController(IExamService service, IPortalService portal)
    {
        _service = service;
        _portal = portal;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ExamDto>>> GetAll([FromQuery] string? classId, CancellationToken ct)
    {
        var list = await _service.GetAllAsync(classId, ct);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExamDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<ExamDto>> Create([FromBody] CreateExamRequest request, CancellationToken ct)
    {
        var dto = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpGet("{examId}/marks")]
    public async Task<ActionResult<IReadOnlyList<MarksEntryDto>>> GetMarks(string examId, CancellationToken ct)
    {
        var list = await _service.GetMarksByExamAsync(examId, ct);
        return Ok(list);
    }

    [HttpPost("marks")]
    public async Task<IActionResult> SaveMarks([FromBody] SaveMarksRequest request, CancellationToken ct)
    {
        if (User.IsInRole("Teacher") || User.IsInRole("teacher"))
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            var exam = await _service.GetByIdAsync(request.ExamId, ct);
            if (exam == null)
                return NotFound();
            if (string.IsNullOrEmpty(exam.ClassId))
                return BadRequest(new { message = "Exam is not linked to a class." });
            var assignedClassIds = await _portal.GetTeacherAssignedClassIdsAsync(userId, ct);
            if (assignedClassIds.Count == 0 || !assignedClassIds.Contains(exam.ClassId))
                return Forbid();
        }
        try
        {
            await _service.SaveMarksAsync(request, ct);
            return NoContent();
        }
        catch (ArgumentException) { return BadRequest(); }
    }
}
