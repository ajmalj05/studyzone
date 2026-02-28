using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.TeacherSalary;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeacherSalaryController : ControllerBase
{
    private readonly ITeacherSalaryService _service;

    public TeacherSalaryController(ITeacherSalaryService service)
    {
        _service = service;
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet("{id}")]
    public async Task<ActionResult<TeacherSalaryDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpGet("by-teacher/{teacherUserId}")]
    public async Task<ActionResult<IReadOnlyList<TeacherSalaryDto>>> GetByTeacher(string teacherUserId, CancellationToken ct)
    {
        var list = await _service.GetByTeacherAsync(teacherUserId, ct);
        return Ok(list);
    }

    [HttpGet("me")]
    [Authorize(Roles = "Teacher,teacher")]
    public async Task<ActionResult<TeacherSalaryDto>> GetMe(CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var dto = await _service.GetCurrentForTeacherAsync(userId, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<TeacherSalaryDto>> Create([FromBody] CreateTeacherSalaryRequest request, CancellationToken ct)
    {
        var dto = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<TeacherSalaryDto>> Update(string id, [FromBody] UpdateTeacherSalaryRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.UpdateAsync(id, request, ct);
            return Ok(dto);
        }
        catch (ArgumentException) { return NotFound(); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        try
        {
            await _service.DeleteAsync(id, ct);
            return NoContent();
        }
        catch (ArgumentException) { return NotFound(); }
    }
}
