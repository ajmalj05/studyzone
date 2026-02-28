using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Dashboard;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    [HttpGet("kpis")]
    public async Task<ActionResult<DashboardKpiDto>> GetKpis(CancellationToken ct)
    {
        var dto = await _service.GetKpisAsync(ct);
        return Ok(dto);
    }

    [HttpGet("admission-pipeline")]
    public async Task<ActionResult<AdmissionPipelineDto>> GetAdmissionPipeline(CancellationToken ct)
    {
        var dto = await _service.GetAdmissionPipelineAsync(ct);
        return Ok(dto);
    }

    [HttpGet("fee-summary")]
    public async Task<ActionResult<IReadOnlyList<FeeSummaryDto>>> GetFeeSummary(CancellationToken ct)
    {
        var list = await _service.GetFeeSummaryByClassAsync(ct);
        return Ok(list);
    }
}
