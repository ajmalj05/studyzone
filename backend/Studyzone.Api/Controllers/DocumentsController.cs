using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Admission;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _service;

    public DocumentsController(IDocumentService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DocumentDto>>> GetByApplication([FromQuery] string applicationId, CancellationToken ct)
    {
        var list = await _service.GetByApplicationIdAsync(applicationId, ct);
        return Ok(list);
    }

    [HttpPost("upload")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<ActionResult<DocumentDto>> Upload([FromForm] string? applicationId, [FromForm] string documentType, [FromForm] IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file.");
        await using var stream = file.OpenReadStream();
        var dto = await _service.UploadAsync(applicationId, documentType, stream, file.FileName, file.ContentType ?? "application/octet-stream", file.Length, ct);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return NoContent();
    }
}
