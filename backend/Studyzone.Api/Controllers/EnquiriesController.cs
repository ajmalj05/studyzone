using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Admission;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnquiriesController : ControllerBase
{
    private readonly IEnquiryService _service;

    public EnquiriesController(IEnquiryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<EnquiryListResponse>> GetAll([FromQuery] string? status, [FromQuery] int skip = 0, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        var (items, total) = await _service.GetAllAsync(status, skip, take, ct);
        return Ok(new EnquiryListResponse { Items = items, Total = total });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EnquiryDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<EnquiryDto>> Create([FromBody] CreateEnquiryRequest request, CancellationToken ct)
    {
        var dto = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<EnquiryDto>> Update(string id, [FromBody] UpdateEnquiryRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.UpdateAsync(id, request, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException) { return NotFound(); }
        catch (ArgumentException) { return BadRequest(); }
    }
}

public class EnquiryListResponse
{
    public IReadOnlyList<EnquiryDto> Items { get; set; } = Array.Empty<EnquiryDto>();
    public int Total { get; set; }
}
