using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Exams;
using Studyzone.Application.Portal;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExamsController : ControllerBase
{
    private readonly IExamService _service;
    private readonly IPortalService _portal;

    public ExamsController(IExamService service, IPortalService portal)
    {
        _service = service;
        _portal = portal;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ExamDto>>> GetAll([FromQuery] string? classId, CancellationToken ct)
    {
        if (IsTeacher())
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            var assignedBatches = await _portal.GetTeacherAssignedBatchesAsync(userId, ct);
            var assigned = assignedBatches.Select(b => b.ClassId).Distinct().ToList();
            var assignedBatchIds = assignedBatches.Select(b => b.Id).Distinct().ToList();
            if (assigned.Count == 0)
                return Ok(Array.Empty<ExamDto>());
            if (!string.IsNullOrWhiteSpace(classId))
            {
                if (!assigned.Contains(classId))
                    return Forbid();
                var filtered = await _service.GetAllAsync(classId, ct);
                return Ok(filtered);
            }
            var forClasses = await _service.GetAllForClassAndBatchIdsAsync(assigned, assignedBatchIds, ct);
            return Ok(forClasses);
        }

        var list = await _service.GetAllAsync(classId, ct);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExamDto>> GetById(string id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();
        if (IsTeacher())
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            if (dto.ClassIds.Count == 0)
                return Forbid();
            var assignedBatches = await _portal.GetTeacherAssignedBatchesAsync(userId, ct);
            var assignedClasses = assignedBatches.Select(b => b.ClassId).Distinct().ToHashSet();
            var assignedBatchIds = assignedBatches.Select(b => b.Id).Distinct().ToHashSet();
            if (!TeacherCanAccessExam(dto, assignedClasses, assignedBatchIds))
                return Forbid();
        }
        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<ExamDto>> Create([FromBody] CreateExamRequest request, CancellationToken ct)
    {
        var dto = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id}/date")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<ExamDto>> UpdateExamDate(string id, [FromBody] UpdateExamDateRequest request, CancellationToken ct)
    {
        var dto = await _service.UpdateExamDateAsync(id, request.ExamDate, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpGet("{examId}/marks")]
    public async Task<ActionResult<IReadOnlyList<MarksEntryDto>>> GetMarks(string examId, CancellationToken ct)
    {
        var approvedOnly = User.IsInRole("Parent") || User.IsInRole("parent")
            || User.IsInRole("Student") || User.IsInRole("student");
        var list = await _service.GetMarksByExamAsync(examId, approvedOnly, ct);

        if (IsTeacher())
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            var exam = await _service.GetByIdAsync(examId, ct);
            if (exam == null)
                return NotFound();
            if (exam.ClassIds.Count == 0)
                return Forbid();
            var assignedBatches = await _portal.GetTeacherAssignedBatchesAsync(userId, ct);
            var assignedClasses = assignedBatches.Select(b => b.ClassId).Distinct().ToHashSet();
            var assignedBatchIds = assignedBatches.Select(b => b.Id).Distinct().ToHashSet();
            if (!TeacherCanAccessExam(exam, assignedClasses, assignedBatchIds))
                return Forbid();
            var classIdForScope = GetTeacherExamClassScope(exam, assignedBatches, assignedClasses);
            if (string.IsNullOrEmpty(classIdForScope))
                return Forbid();
            var scope = await _portal.GetTeacherMarksScopeForClassAsync(userId, classIdForScope, ct);
            if (scope == null)
                return Forbid();
            if (scope.IsClassTeacher)
                return Ok(list);
            if (scope.SubjectScope.Count == 0)
                return Ok(Array.Empty<MarksEntryDto>());
            list = list.Where(m => SubjectInScope(m.Subject, scope.SubjectScope)).ToList();
        }

        return Ok(list);
    }

    [HttpPost("{examId}/marks/approve-all")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<object>> ApproveAllMarks(string examId, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        try
        {
            var count = await _service.ApproveAllPendingMarksForExamAsync(examId, userId, ct);
            return Ok(new { approvedCount = count });
        }
        catch (ArgumentException)
        {
            return BadRequest();
        }
    }

    [HttpPost("marks/{entryId}/approve")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<IActionResult> ApproveMarksEntry(string entryId, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var ok = await _service.ApproveMarksEntryAsync(entryId, userId, ct);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpPost("marks/{entryId}/reject")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<IActionResult> RejectMarksEntry(string entryId, [FromBody] RejectMarksEntryRequest? body, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();
        var ok = await _service.RejectMarksEntryAsync(entryId, body?.Reason, userId, ct);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpPost("marks")]
    public async Task<IActionResult> SaveMarks([FromBody] SaveMarksRequest request, CancellationToken ct)
    {
        if (IsTeacher())
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();
            var exam = await _service.GetByIdAsync(request.ExamId, ct);
            if (exam == null)
                return NotFound();
            if (exam.ClassIds.Count == 0)
                return BadRequest(new { message = "Exam is not linked to a class." });
            var assignedBatches = await _portal.GetTeacherAssignedBatchesAsync(userId, ct);
            var assignedClasses = assignedBatches.Select(b => b.ClassId).Distinct().ToHashSet();
            var assignedBatchIds = assignedBatches.Select(b => b.Id).Distinct().ToHashSet();
            if (!TeacherCanAccessExam(exam, assignedClasses, assignedBatchIds))
                return Forbid();
            var classIdForScope = GetTeacherExamClassScope(exam, assignedBatches, assignedClasses);
            if (string.IsNullOrEmpty(classIdForScope))
                return BadRequest(new { message = "Exam is not linked to a class." });
            var scope = await _portal.GetTeacherMarksScopeForClassAsync(userId, classIdForScope, ct);
            if (scope == null)
                return Forbid();
            if (!scope.IsClassTeacher)
            {
                if (scope.SubjectScope.Count == 0)
                    return Forbid();
                if (!SubjectInScope(request.Subject, scope.SubjectScope))
                    return Forbid();
            }
        }
        try
        {
            await _service.SaveMarksAsync(request, ct);
            return NoContent();
        }
        catch (ArgumentException) { return BadRequest(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("{examId}/schedule")]
    public async Task<ActionResult<IReadOnlyList<ExamScheduleEntryDto>>> GetSchedule(string examId, CancellationToken ct)
    {
        var list = await _service.GetScheduleByExamIdAsync(examId, ct);
        return Ok(list);
    }

    [HttpGet("schedule/mine")]
    [Authorize(Roles = "Teacher,teacher")]
    public async Task<ActionResult<IReadOnlyList<ExamScheduleEntryDto>>> GetMySchedule(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var list = await _service.GetScheduleForTeacherAsync(userId, ct);
        return Ok(list);
    }

    [HttpPost("{examId}/schedule")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<ExamScheduleEntryDto>> CreateScheduleEntry(string examId, [FromBody] CreateExamScheduleEntryRequest request, CancellationToken ct)
    {
        request.ExamId = examId;
        try
        {
            var dto = await _service.CreateScheduleEntryAsync(request, ct);
            return CreatedAtAction(nameof(GetSchedule), new { examId }, dto);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("schedule/{entryId}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<ActionResult<ExamScheduleEntryDto>> UpdateScheduleEntry(string entryId, [FromBody] UpdateExamScheduleEntryRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.UpdateScheduleEntryAsync(entryId, request, ct);
            return Ok(dto);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("schedule/{entryId}")]
    [Authorize(Roles = "Admin,admin")]
    public async Task<IActionResult> DeleteScheduleEntry(string entryId, CancellationToken ct)
    {
        try
        {
            await _service.DeleteScheduleEntryAsync(entryId, ct);
            return NoContent();
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    private bool IsTeacher() => User.IsInRole("Teacher") || User.IsInRole("teacher");

    private static bool TeacherCanAccessExam(ExamDto exam, IReadOnlySet<string> assignedClassIds, IReadOnlySet<string> assignedBatchIds)
    {
        return exam.BatchIds.Any(assignedBatchIds.Contains)
            || exam.ClassWideClassIds.Any(assignedClassIds.Contains);
    }

    private static string? GetTeacherExamClassScope(ExamDto exam, IReadOnlyList<TeacherAssignedBatchDto> assignedBatches, IReadOnlySet<string> assignedClassIds)
    {
        var classWideScope = exam.ClassWideClassIds.FirstOrDefault(assignedClassIds.Contains);
        if (!string.IsNullOrEmpty(classWideScope))
            return classWideScope;

        return assignedBatches.FirstOrDefault(b => exam.BatchIds.Contains(b.Id))?.ClassId;
    }

    private static bool SubjectInScope(string subject, IReadOnlyList<string> scope)
    {
        if (string.IsNullOrWhiteSpace(subject))
            return false;
        var t = subject.Trim();
        return scope.Any(s => string.Equals(s, t, StringComparison.OrdinalIgnoreCase));
    }
}
