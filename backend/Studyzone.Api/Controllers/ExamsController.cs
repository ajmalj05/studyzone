using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Exams;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExamsController : ControllerBase
{
    private readonly IExamService _service;

    public ExamsController(IExamService service)
    {
        _service = service;
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
        try
        {
            await _service.SaveMarksAsync(request, ct);
            return NoContent();
        }
        catch (ArgumentException) { return BadRequest(); }
    }
}
