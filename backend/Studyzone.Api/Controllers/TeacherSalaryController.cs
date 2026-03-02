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
    private readonly ITeacherSalaryPaymentService _paymentService;

    public TeacherSalaryController(ITeacherSalaryService service, ITeacherSalaryPaymentService paymentService)
    {
        _service = service;
        _paymentService = paymentService;
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    // ----- Payment (monthly payroll) endpoints -----
    [HttpGet("payments")]
    public async Task<ActionResult<IReadOnlyList<TeacherSalaryPaymentDto>>> GetPaymentsByMonth([FromQuery] int year, [FromQuery] int month, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var y = year >= 1 && year <= 9999 ? year : now.Year;
        var m = month >= 1 && month <= 12 ? month : now.Month;
        var list = await _paymentService.GetByMonthAsync(y, m, ct);
        return Ok(list);
    }

    [HttpGet("payments/by-teacher/{teacherUserId}")]
    public async Task<ActionResult<IReadOnlyList<TeacherSalaryPaymentDto>>> GetPaymentsByTeacher(string teacherUserId, CancellationToken ct)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        if (!User.IsInRole("Admin") && !User.IsInRole("admin") && !userId.Equals(teacherUserId, StringComparison.OrdinalIgnoreCase))
            return Forbid();
        var list = await _paymentService.GetByTeacherAsync(teacherUserId, ct);
        return Ok(list);
    }

    [HttpGet("payments/{id}")]
    public async Task<ActionResult<TeacherSalaryPaymentDto>> GetPaymentById(string id, CancellationToken ct)
    {
        var dto = await _paymentService.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId) && !User.IsInRole("Admin") && !User.IsInRole("admin") && dto.TeacherUserId != userId)
            return Forbid();
        return Ok(dto);
    }

    [HttpPost("payments")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<TeacherSalaryPaymentDto>> CreatePayment([FromBody] CreateTeacherSalaryPaymentRequest request, CancellationToken ct)
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
    public async Task<ActionResult<TeacherSalaryPaymentDto>> UpdatePayment(string id, [FromBody] UpdateTeacherSalaryPaymentRequest request, CancellationToken ct)
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
    public async Task<ActionResult<TeacherSalaryPaymentLineDto>> AddPaymentLine(string id, [FromBody] AddTeacherSalaryPaymentLineRequest request, CancellationToken ct)
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
    public async Task<ActionResult<TeacherSalaryPaymentLineDto>> UpdatePaymentLine(string id, string lineId, [FromBody] UpdateTeacherSalaryPaymentLineRequest request, CancellationToken ct)
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

    // ----- Salary slab (existing) endpoints -----
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
