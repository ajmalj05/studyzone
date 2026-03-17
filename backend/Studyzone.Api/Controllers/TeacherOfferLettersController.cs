using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.TeacherOfferLetter;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeacherOfferLettersController : ControllerBase
{
    private readonly ITeacherOfferLetterService _service;

    public TeacherOfferLettersController(ITeacherOfferLetterService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<IReadOnlyList<TeacherOfferLetterDto>>> GetAll(CancellationToken ct)
    {
        var list = await _service.GetAllAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<TeacherOfferLetterDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<TeacherOfferLetterDto>> Create([FromBody] CreateTeacherOfferLetterRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.CandidateName))
            return BadRequest("CandidateName is required.");
        var dto = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<TeacherOfferLetterDto>> Update(string id, [FromBody] UpdateTeacherOfferLetterRequest request, CancellationToken ct)
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
