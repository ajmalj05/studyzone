using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Students;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly IClassService _service;

    public ClassesController(IClassService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClassDto>>> GetAll(CancellationToken ct)
    {
        var list = await _service.GetAllAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClassDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<ClassDto>> Create([FromBody] CreateClassRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ClassDto>> Update(string id, [FromBody] CreateClassRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.UpdateAsync(id, request, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException ex) when (ex.Message == "Class not found.")
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
