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
        var baseUrl = $"{Request.Scheme}://{Request.Host}".TrimEnd('/');
        var url = await _service.GetDownloadUrlAsync(dto.Id, baseUrl, ct);
        dto.Url = !string.IsNullOrEmpty(url) ? url : $"{baseUrl}/api/Documents/{dto.Id}/download";
        return Ok(dto);
    }

    [HttpGet("{id}/url")]
    public async Task<ActionResult<object>> GetUrl(string id, CancellationToken ct)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var url = await _service.GetDownloadUrlAsync(id, baseUrl, ct);
        if (string.IsNullOrEmpty(url))
            return NotFound();
        return Ok(new { url });
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(string id, CancellationToken ct)
    {
        var doc = await _service.GetByIdAsync(id, ct);
        if (doc == null)
            return NotFound();
        var stream = await _service.GetStreamAsync(id, ct);
        if (stream == null)
            return NotFound();
        var fileName = doc.FileName ?? "download";
        return File(stream, doc.ContentType ?? "application/octet-stream", fileName);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return NoContent();
    }
}
