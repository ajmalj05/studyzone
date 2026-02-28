using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Administration;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SchoolProfileController : ControllerBase
{
    private readonly ISchoolProfileService _service;

    public SchoolProfileController(ISchoolProfileService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<SchoolProfileDto>> Get(CancellationToken ct)
    {
        var dto = await _service.GetAsync(ct);
        return Ok(dto);
    }

    [HttpPut]
    public async Task<ActionResult<SchoolProfileDto>> CreateOrUpdate([FromBody] UpdateSchoolProfileRequest request, CancellationToken ct)
    {
        var dto = await _service.CreateOrUpdateAsync(request, ct);
        return Ok(dto);
    }
}
