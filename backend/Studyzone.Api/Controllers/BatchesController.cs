using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Students;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BatchesController : ControllerBase
{
    private readonly IBatchService _service;

    public BatchesController(IBatchService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BatchDto>>> GetAll(CancellationToken ct)
    {
        var list = await _service.GetAllAsync(ct);
        return Ok(list);
    }

    [HttpGet("by-class/{classId}")]
    public async Task<ActionResult<IReadOnlyList<BatchDto>>> GetByClass(string classId, CancellationToken ct)
    {
        var list = await _service.GetByClassIdAsync(classId, ct);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BatchDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<BatchDto>> Create([FromBody] CreateBatchRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
        }
        catch (ArgumentException) { return BadRequest(); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BatchDto>> Update(string id, [FromBody] CreateBatchRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.UpdateAsync(id, request, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException) { return NotFound(); }
    }
}
