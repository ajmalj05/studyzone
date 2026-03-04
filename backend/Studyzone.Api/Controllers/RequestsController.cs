using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Requests;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RequestsController : ControllerBase
{
    private readonly IRequestsService _service;

    public RequestsController(IRequestsService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RequestDto>>> Get([FromQuery] string? role, [FromQuery] string? userId, CancellationToken ct)
    {
        var list = await _service.GetAsync(role, userId, ct);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RequestDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<RequestDto>> Create([FromBody] CreateRequestRequest request, CancellationToken ct)
    {
        var isAdmin = User.IsInRole("admin") || User.IsInRole("Admin");
        if (!isAdmin)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(currentUserId))
                request.UserId = currentUserId;
        }
        var dto = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RequestDto>> Update(string id, [FromBody] UpdateRequestRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.UpdateAsync(id, request, ct);
            return Ok(dto);
        }
        catch (ArgumentException) { return NotFound(); }
    }
}
