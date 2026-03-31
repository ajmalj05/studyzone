using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.TeacherOfferLetter;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OfferLetterFieldConfigsController : ControllerBase
{
    private readonly IOfferLetterFieldConfigService _service;

    public OfferLetterFieldConfigsController(IOfferLetterFieldConfigService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<IReadOnlyList<OfferLetterFieldConfigDto>>> GetAll(CancellationToken ct)
    {
        var list = await _service.GetAllAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<OfferLetterFieldConfigDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<OfferLetterFieldConfigDto>> Create([FromBody] CreateOfferLetterFieldConfigRequest request, CancellationToken ct)
    {
        var dto = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<OfferLetterFieldConfigDto>> Update(string id, [FromBody] UpdateOfferLetterFieldConfigRequest request, CancellationToken ct)
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

    [HttpPost("reset-to-defaults")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<IActionResult> ResetToDefaults(CancellationToken ct)
    {
        await _service.ResetToDefaultsAsync(ct);
        return Ok(new { message = "Reset to defaults successful" });
    }

    [HttpPost("seed-defaults")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<IActionResult> SeedDefaults(CancellationToken ct)
    {
        await _service.SeedDefaultsAsync(ct);
        return Ok(new { message = "Defaults seeded successfully" });
    }
}