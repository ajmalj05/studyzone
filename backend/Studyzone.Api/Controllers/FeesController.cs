using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Studyzone.Application.Fees;

namespace Studyzone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeesController : ControllerBase
{
    private readonly IFeeService _service;

    public FeesController(IFeeService service)
    {
        _service = service;
    }

    [HttpGet("structures")]
    public async Task<ActionResult<IReadOnlyList<FeeStructureDto>>> GetStructures([FromQuery] string? classId, [FromQuery] string? academicYearId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(classId))
        {
            var all = await _service.GetAllStructuresAsync(academicYearId, ct);
            return Ok(all);
        }
        var list = await _service.GetStructuresByClassAsync(classId, academicYearId, ct);
        return Ok(list);
    }

    [HttpGet("structures/{id}")]
    public async Task<ActionResult<FeeStructureDto>> GetStructureById(string id, CancellationToken ct)
    {
        var dto = await _service.GetStructureByIdAsync(id, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost("structures")]
    public async Task<ActionResult<FeeStructureDto>> CreateStructure([FromBody] CreateFeeStructureRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.CreateStructureAsync(request, ct);
            return CreatedAtAction(nameof(GetStructureById), new { id = dto.Id }, dto);
        }
        catch (ArgumentException) { return BadRequest(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("charges")]
    public async Task<IActionResult> AddCharge([FromBody] AddChargeRequest request, CancellationToken ct)
    {
        try
        {
            await _service.AddChargeAsync(request, ct);
            return NoContent();
        }
        catch (ArgumentException) { return BadRequest(); }
    }

    [HttpPost("generate-charges")]
    public async Task<ActionResult<GenerateChargesResult>> GenerateCharges([FromBody] GenerateChargesRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _service.GenerateChargesForStudentAsync(request, ct);
            return Ok(result);
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpGet("ledger/{studentId}")]
    public async Task<ActionResult<FeeLedgerDto>> GetLedger(string studentId, [FromQuery] string? periodFrom, [FromQuery] string? periodTo, CancellationToken ct)
    {
        try
        {
            var dto = await _service.GetLedgerAsync(studentId, periodFrom, periodTo, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException) { return NotFound(); }
    }

    [HttpGet("outstanding")]
    public async Task<ActionResult<IReadOnlyList<FeeLedgerDto>>> GetOutstanding([FromQuery] string? classId, [FromQuery] string? academicYearId, CancellationToken ct)
    {
        var list = await _service.GetOutstandingByClassAsync(classId, academicYearId, ct);
        return Ok(list);
    }

    [HttpPost("outstanding/recalculate")]
    public async Task<ActionResult<IReadOnlyList<FeeLedgerDto>>> RecalculateOutstanding([FromQuery] string? classId, [FromQuery] string? academicYearId, CancellationToken ct)
    {
        var list = await _service.RecalculateOutstandingAsync(classId, academicYearId, ct);
        return Ok(list);
    }

    [HttpPost("payments")]
    public async Task<ActionResult<PaymentDto>> RecordPayment([FromBody] RecordPaymentRequest request, CancellationToken ct)
    {
        try
        {
            var dto = await _service.RecordPaymentAsync(request, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException) { return NotFound(); }
        catch (ArgumentException) { return BadRequest(); }
    }

    [HttpGet("payments")]
    public async Task<ActionResult<IReadOnlyList<PaymentDto>>> GetPayments([FromQuery] string studentId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        var list = await _service.GetPaymentsByStudentAsync(studentId, from, to, ct);
        return Ok(list);
    }

    [HttpGet("receipt/{paymentId}")]
    public async Task<ActionResult<FeeReceiptDto>> GetReceipt(string paymentId, CancellationToken ct)
    {
        var dto = await _service.GetReceiptAsync(paymentId, ct);
        if (dto == null) return NotFound();
        return Ok(dto);
    }

    [HttpPost("admission-fee")]
    public async Task<ActionResult<AddAdmissionFeeResult>> AddAdmissionFee([FromBody] AddAdmissionFeeRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _service.AddAdmissionFeeAsync(request, ct);
            return Ok(result);
        }
        catch (ArgumentException) { return BadRequest(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }
}
