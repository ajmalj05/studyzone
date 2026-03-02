using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Students;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _service;

    public StudentsController(IStudentService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<StudentListResponse>> GetAll([FromQuery] string? classId, [FromQuery] string? batchId, [FromQuery] string? status, [FromQuery] string? academicYearId, [FromQuery] int skip = 0, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        var (items, total) = await _service.GetAllAsync(classId, batchId, status, academicYearId, skip, take, ct);
        return Ok(new StudentListResponse { Items = items, Total = total });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StudentDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<StudentDto>> Create([FromBody] CreateStudentRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
        }
        catch (Exception) { return BadRequest(); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<StudentDto>> Update(string id, [FromBody] UpdateStudentRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.UpdateAsync(id, request, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException) { return NotFound(); }
        catch (ArgumentException) { return BadRequest(); }
    }

    [HttpPost("{id}/status")]
    public async Task<IActionResult> SetStatus(string id, [FromBody] SetStatusRequest request, CancellationToken ct)
    {
        try
        {
            await _service.SetStatusAsync(id, request.Status, request.Notes, ct);
            return NoContent();
        }
        catch (InvalidOperationException) { return NotFound(); }
    }

    [HttpPost("bulk-promote")]
    public async Task<IActionResult> BulkPromote([FromBody] BulkPromoteRequest request, CancellationToken ct)
    {
        try
        {
            await _service.BulkPromoteAsync(request, ct);
            return NoContent();
        }
        catch (ArgumentException) { return BadRequest(); }
    }
}

public class SetStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class StudentListResponse
{
    public IReadOnlyList<StudentDto> Items { get; set; } = Array.Empty<StudentDto>();
    public int Total { get; set; }
}
