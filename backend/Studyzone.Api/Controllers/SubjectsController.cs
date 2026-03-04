using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Subjects;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubjectsController : ControllerBase
{
    private readonly ISubjectService _service;

    public SubjectsController(ISubjectService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SubjectDto>>> GetAll(CancellationToken ct)
    {
        var list = await _service.GetAllAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SubjectDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpGet("for-class/{classId}")]
    public async Task<ActionResult<IReadOnlyList<SubjectDto>>> GetForClass(string classId, CancellationToken ct)
    {
        var list = await _service.GetByClassIdAsync(classId, ct);
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<SubjectDto>> Create([FromBody] CreateSubjectRequest request, CancellationToken ct)
    {
        var dto = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SubjectDto>> Update(string id, [FromBody] CreateSubjectRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.UpdateAsync(id, request, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException) { return NotFound(); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        try
        {
            await _service.DeleteAsync(id, ct);
            return NoContent();
        }
        catch (ArgumentException) { return NotFound(); }
    }

    [HttpPut("for-class/{classId}")]
    public async Task<IActionResult> SetSubjectsForClass(string classId, [FromBody] SetSubjectsForClassRequest request, CancellationToken ct)
    {
        try
        {
            await _service.SetSubjectsForClassAsync(classId, request, ct);
            return NoContent();
        }
        catch (InvalidOperationException) { return NotFound(); }
        catch (ArgumentException) { return BadRequest(); }
    }
}
