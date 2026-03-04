using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Expenses;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,admin")]
public class ExpensesController : ControllerBase
{
    private readonly ISchoolExpenseService _service;

    public ExpensesController(ISchoolExpenseService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SchoolExpenseDto>>> GetList([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo, [FromQuery] string? category, CancellationToken ct)
    {
        var list = await _service.GetListAsync(dateFrom, dateTo, category, ct);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SchoolExpenseDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<SchoolExpenseDto>> Create([FromBody] CreateSchoolExpenseRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SchoolExpenseDto>> Update(string id, [FromBody] UpdateSchoolExpenseRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.UpdateAsync(id, request, ct);
            return Ok(dto);
        }
        catch (ArgumentException ex)
        {
            if (ex.Message == "Expense not found.") return NotFound();
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        try
        {
            await _service.DeleteAsync(id, ct);
            return NoContent();
        }
        catch (ArgumentException)
        {
            return NotFound();
        }
    }
}
