using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Administration;
using Studyzone.Application.ParentPortal;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,admin")]
public class ParentManagementController : ControllerBase
{
    private readonly IParentManagementService _parentService;
    private readonly IUserManagementService _userService;

    public ParentManagementController(IParentManagementService parentService, IUserManagementService userService)
    {
        _parentService = parentService;
        _userService = userService;
    }

    [HttpGet("parents")]
    public async Task<ActionResult<IReadOnlyList<ParentWithLinksDto>>> GetParentsWithLinks(CancellationToken ct)
    {
        var list = await _parentService.GetParentsWithLinksAsync(ct);
        return Ok(list);
    }

    [HttpPost("link")]
    public async Task<IActionResult> LinkStudent([FromBody] LinkStudentRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.ParentUserId) || string.IsNullOrWhiteSpace(request.StudentId))
            return BadRequest("ParentUserId and StudentId are required.");
        await _parentService.LinkStudentAsync(request.ParentUserId, request.StudentId, ct);
        return NoContent();
    }

    [HttpDelete("link")]
    public async Task<IActionResult> UnlinkStudent([FromQuery] string parentUserId, [FromQuery] string studentId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(parentUserId) || string.IsNullOrWhiteSpace(studentId))
            return BadRequest("parentUserId and studentId query parameters are required.");
        await _parentService.UnlinkStudentAsync(parentUserId, studentId, ct);
        return NoContent();
    }
}
