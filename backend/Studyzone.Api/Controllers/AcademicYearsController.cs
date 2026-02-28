using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Administration;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AcademicYearsController : ControllerBase
{
    private readonly IAcademicYearService _service;

    public AcademicYearsController(IAcademicYearService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AcademicYearDto>>> GetAll([FromQuery] bool includeArchived = false, CancellationToken ct = default)
    {
        var list = await _service.GetAllAsync(includeArchived, ct);
        return Ok(list);
    }

    [HttpGet("current")]
    public async Task<ActionResult<AcademicYearDto>> GetCurrent(CancellationToken ct)
    {
        var dto = await _service.GetCurrentAsync(ct);
        return Ok(dto);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AcademicYearDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null)
            return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<AcademicYearDto>> Create([FromBody] CreateAcademicYearRequest request, CancellationToken ct)
    {
        var dto = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AcademicYearDto>> Update(string id, [FromBody] UpdateAcademicYearRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.UpdateAsync(id, request, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/set-current")]
    public async Task<IActionResult> SetCurrent(string id, CancellationToken ct)
    {
        try
        {
            await _service.SetCurrentAsync(id, ct);
            return NoContent();
        }
        catch (ArgumentException)
        {
            return BadRequest();
        }
    }
}
