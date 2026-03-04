using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Admission;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdmissionApplicationsController : ControllerBase
{
    private readonly IApplicationService _service;

    public AdmissionApplicationsController(IApplicationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApplicationListResponse>> GetAll([FromQuery] string? status, [FromQuery] string? classId, [FromQuery] string? batchId, [FromQuery] int skip = 0, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        var (items, total) = await _service.GetAllAsync(status, classId, batchId, skip, take, ct);
        return Ok(new ApplicationListResponse { Items = items, Total = total });
    }

    [HttpGet("pending")]
    public async Task<ActionResult<ApplicationListResponse>> GetPending([FromQuery] int skip = 0, [FromQuery] int take = 50, CancellationToken ct = default)
    {
        var (items, total) = await _service.GetPendingApprovalsAsync(skip, take, ct);
        return Ok(new ApplicationListResponse { Items = items, Total = total });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApplicationDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<ApplicationDto>> Create([FromBody] CreateApplicationRequest request, CancellationToken ct)
    {
        var dto = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApplicationDto>> Update(string id, [FromBody] UpdateApplicationRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.UpdateAsync(id, request, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException) { return NotFound(); }
        catch (ArgumentException) { return BadRequest(); }
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult<ApplicationDto>> Submit(string id, [FromBody] SubmitForApprovalRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.SubmitForApprovalAsync(id, request, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException) { return BadRequest(); }
        catch (ArgumentException) { return BadRequest(); }
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApplicationDto>> Approve(string id, [FromBody] ApprovalDecisionRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        try
        {
            var dto = await _service.ApproveOrRejectAsync(id, request, userId, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException) { return BadRequest(); }
        catch (ArgumentException) { return BadRequest(); }
    }

    [HttpPost("{id}/submit-and-enroll")]
    public async Task<ActionResult<ApplicationDto>> SubmitAndEnroll(string id, CancellationToken ct = default)
    {
        try
        {
            var dto = await _service.SubmitAndEnrollAsync(id, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }
}

public class ApplicationListResponse
{
    public IReadOnlyList<ApplicationDto> Items { get; set; } = Array.Empty<ApplicationDto>();
    public int Total { get; set; }
}
