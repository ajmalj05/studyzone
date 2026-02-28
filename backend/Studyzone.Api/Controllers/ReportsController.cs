using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Reports;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportsService _service;

    public ReportsController(IReportsService service)
    {
        _service = service;
    }

    [HttpGet("enrollment")]
    public async Task<ActionResult<IReadOnlyList<EnrollmentReportDto>>> GetEnrollment([FromQuery] string? classId, CancellationToken ct)
    {
        var list = await _service.GetEnrollmentByClassAsync(classId, ct);
        return Ok(list);
    }

    [HttpGet("batch-strength")]
    public async Task<ActionResult<IReadOnlyList<BatchStrengthReportDto>>> GetBatchStrength([FromQuery] string? classId, CancellationToken ct)
    {
        var list = await _service.GetBatchStrengthAsync(classId, ct);
        return Ok(list);
    }

    [HttpGet("financial")]
    public async Task<ActionResult<FinancialReportDto>> GetFinancial([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        var dto = await _service.GetFinancialReportAsync(from, to, ct);
        return Ok(dto);
    }

    [HttpGet("attendance")]
    public async Task<ActionResult<AttendanceReportDto>> GetAttendance([FromQuery] string? classId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        var dto = await _service.GetAttendanceReportAsync(classId, from, to, ct);
        return Ok(dto);
    }

    [HttpGet("academic")]
    public async Task<ActionResult<AcademicReportDto?>> GetAcademic([FromQuery] string examId, CancellationToken ct)
    {
        var dto = await _service.GetAcademicReportAsync(examId, ct);
        if (dto == null)
            return NotFound();
        return Ok(dto);
    }

    [HttpGet("admission-conversion")]
    public async Task<ActionResult<AdmissionConversionReportDto>> GetAdmissionConversion([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        var dto = await _service.GetAdmissionConversionAsync(from, to, ct);
        return Ok(dto);
    }

    [HttpGet("teacher-workload")]
    public async Task<ActionResult<TeacherWorkloadReportDto>> GetTeacherWorkload(CancellationToken ct)
    {
        var dto = await _service.GetTeacherWorkloadAsync(ct);
        return Ok(dto);
    }
}
