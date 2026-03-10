namespace Studyzone.Application.Fees;

public interface IFeeService
{
    Task<FeeStructureDto?> GetStructureByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<FeeStructureDto>> GetStructuresByClassAsync(string classId, string? academicYearId, CancellationToken ct = default);
    Task<IReadOnlyList<FeeStructureDto>> GetAllStructuresAsync(string? academicYearId, CancellationToken ct = default);
    Task<FeeStructureDto> CreateStructureAsync(CreateFeeStructureRequest request, CancellationToken ct = default);
    Task AddChargeAsync(AddChargeRequest request, CancellationToken ct = default);
    Task<FeeLedgerDto> GetLedgerAsync(string studentId, string? periodFrom, string? periodTo, CancellationToken ct = default);
    Task<PaymentDto> RecordPaymentAsync(RecordPaymentRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<PaymentDto>> GetPaymentsByStudentAsync(string studentId, DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<IReadOnlyList<FeeLedgerDto>> GetOutstandingByClassAsync(string? classId, string? academicYearId, CancellationToken ct = default);
    Task<IReadOnlyList<FeeLedgerDto>> RecalculateOutstandingAsync(string? classId, string? academicYearId, CancellationToken ct = default);
    Task<GenerateChargesResult> GenerateChargesForStudentAsync(GenerateChargesRequest request, CancellationToken ct = default);
    Task<FeeReceiptDto?> GetReceiptAsync(string paymentId, CancellationToken ct = default);
}
