using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IPaymentRepository
{
    Task<Payment?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Payment>> GetByStudentIdAsync(Guid studentId, DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<IReadOnlyList<Payment>> GetAllAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<decimal> GetTotalPaymentsAsync(Guid studentId, DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<decimal> GetTotalRevenueAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<Payment> AddAsync(Payment entity, CancellationToken ct = default);
}

public interface IReceiptSequenceRepository
{
    Task<int> GetNextAsync(string prefix, CancellationToken ct = default);
}
