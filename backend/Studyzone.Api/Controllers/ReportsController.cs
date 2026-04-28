using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Portal;
using Studyzone.Application.Reports;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportsService _service;
    private readonly IPortalService _portal;

    public ReportsController(IReportsService service, IPortalService portal)
    {
        _service = service;
        _portal = portal;
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
    public async Task<ActionResult<FinancialReportDto>> GetFinancial([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? academicYearId, CancellationToken ct)
    {
        var dto = await _service.GetFinancialReportAsync(from, to, academicYearId, ct);
        return Ok(dto);
    }

    [HttpGet("attendance")]
    public async Task<ActionResult<AttendanceReportDto>> GetAttendance([FromQuery] string? classId, [FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string? academicYearId, CancellationToken ct)
    {
        var effectiveClassId = classId;
        if (IsTeacher())
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            var assignedClassIds = (await _portal.GetTeacherAssignedClassIdsAsync(userId, ct)).Distinct().ToList();
            if (assignedClassIds.Count == 0)
                return Ok(new AttendanceReportDto { From = from, To = to, ClassId = classId, Rows = Array.Empty<AttendanceReportRowDto>() });

            if (!string.IsNullOrWhiteSpace(effectiveClassId))
            {
                if (!assignedClassIds.Contains(effectiveClassId))
                    return Forbid();
            }
            else
            {
                effectiveClassId = assignedClassIds[0];
            }
        }

        var dto = await _service.GetAttendanceReportAsync(effectiveClassId, from, to, academicYearId, ct);
        return Ok(dto);
    }

    [HttpGet("attendance/student")]
    public async Task<ActionResult<StudentAttendanceDetailDto>> GetStudentAttendanceDetail([FromQuery] string studentId, [FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string? academicYearId, CancellationToken ct)
    {
        var dto = await _service.GetStudentAttendanceDetailAsync(studentId, from, to, academicYearId, ct);
        if (dto == null)
            return NotFound();

        if (IsTeacher())
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            var assignedClassIds = (await _portal.GetTeacherAssignedClassIdsAsync(userId, ct)).Distinct().ToHashSet();
            if (string.IsNullOrWhiteSpace(dto.ClassId) || !assignedClassIds.Contains(dto.ClassId))
                return Forbid();
        }

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

    private bool IsTeacher() => User.IsInRole("Teacher") || User.IsInRole("teacher");
}
