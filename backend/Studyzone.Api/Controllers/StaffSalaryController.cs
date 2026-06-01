using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.StaffSalary;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StaffSalaryController : ControllerBase
{
    private readonly IStaffSalaryService _service;
    private readonly IStaffSalaryPaymentService _paymentService;

    public StaffSalaryController(IStaffSalaryService service, IStaffSalaryPaymentService paymentService)
    {
        _service = service;
        _paymentService = paymentService;
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    // ----- Payment (monthly payroll) endpoints -----
    [HttpGet("payments")]
    public async Task<ActionResult<IReadOnlyList<StaffSalaryPaymentDto>>> GetPayments(
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromQuery] string? status,
        [FromQuery] int? yearFrom,
        [FromQuery] int? yearTo,
        [FromQuery] int? monthFrom,
        [FromQuery] int? monthTo,
        CancellationToken ct)
    {
        if (year.HasValue && month.HasValue)
        {
            var now = DateTime.UtcNow;
            var y = year.Value >= 1 && year.Value <= 9999 ? year.Value : now.Year;
            var m = month.Value >= 1 && month.Value <= 12 ? month.Value : now.Month;
            var list = await _paymentService.GetByMonthAsync(y, m, ct);
            return Ok(list);
        }
        if (yearFrom.HasValue || yearTo.HasValue || !string.IsNullOrWhiteSpace(status))
        {
            var list = await _paymentService.GetByStatusAndDateRangeAsync(status?.Trim(), yearFrom, yearTo, monthFrom, monthTo, ct);
            return Ok(list);
        }
        var nowFallback = DateTime.UtcNow;
        var listDefault = await _paymentService.GetByMonthAsync(nowFallback.Year, nowFallback.Month, ct);
        return Ok(listDefault);
    }

    [HttpGet("payments/by-staff/{staffUserId}")]
    public async Task<ActionResult<IReadOnlyList<StaffSalaryPaymentDto>>> GetPaymentsByStaff(string staffUserId, CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        if (!User.IsInRole("Admin") && !User.IsInRole("admin") && !userId.Equals(staffUserId, StringComparison.OrdinalIgnoreCase))
            return Forbid();
        var list = await _paymentService.GetByStaffAsync(staffUserId, ct);
        return Ok(list);
    }

    [HttpGet("payments/{id}")]
    public async Task<ActionResult<StaffSalaryPaymentDto>> GetPaymentById(string id, CancellationToken ct)
    {
        var dto = await _paymentService.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId) && !User.IsInRole("Admin") && !User.IsInRole("admin") && dto.StaffUserId != userId)
            return Forbid();
        return Ok(dto);
    }

    [HttpPost("payments")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<StaffSalaryPaymentDto>> CreatePayment([FromBody] CreateStaffSalaryPaymentRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _paymentService.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetPaymentById), new { id = dto.Id }, dto);
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpPut("payments/{id}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<StaffSalaryPaymentDto>> UpdatePayment(string id, [FromBody] UpdateStaffSalaryPaymentRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _paymentService.UpdateAsync(id, request, ct);
            return Ok(dto);
        }
        catch (ArgumentException) { return NotFound(); }
    }

    [HttpPost("payments/{id}/lines")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<StaffSalaryPaymentLineDto>> AddPaymentLine(string id, [FromBody] AddStaffSalaryPaymentLineRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _paymentService.AddLineAsync(id, request, ct);
            return Ok(dto);
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpPut("payments/{id}/lines/{lineId}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<StaffSalaryPaymentLineDto>> UpdatePaymentLine(string id, string lineId, [FromBody] UpdateStaffSalaryPaymentLineRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _paymentService.UpdateLineAsync(id, lineId, request, ct);
            return Ok(dto);
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpDelete("payments/{id}/lines/{lineId}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<IActionResult> DeletePaymentLine(string id, string lineId, CancellationToken ct)
    {
        try
        {
            await _paymentService.DeleteLineAsync(id, lineId, ct);
            return NoContent();
        }
        catch (ArgumentException) { return NotFound(); }
    }

    // ----- Salary slab endpoints -----
    [HttpGet("{id}")]
    public async Task<ActionResult<StaffSalaryDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpGet("by-staff/{staffUserId}")]
    public async Task<ActionResult<IReadOnlyList<StaffSalaryDto>>> GetByStaff(string staffUserId, CancellationToken ct)
    {
        var list = await _service.GetByStaffAsync(staffUserId, ct);
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<StaffSalaryDto>> Create([FromBody] CreateStaffSalaryRequest request, CancellationToken ct)
    {
        var dto = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<StaffSalaryDto>> Update(string id, [FromBody] UpdateStaffSalaryRequest request, CancellationToken ct)
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
