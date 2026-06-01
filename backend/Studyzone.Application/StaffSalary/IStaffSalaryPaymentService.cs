using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Studyzone.Application.StaffSalary;

public interface IStaffSalaryPaymentService
{
    Task<StaffSalaryPaymentDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<StaffSalaryPaymentDto>> GetByStaffAsync(string staffUserId, CancellationToken ct = default);
    Task<IReadOnlyList<StaffSalaryPaymentDto>> GetByMonthAsync(int year, int month, CancellationToken ct = default);
    Task<IReadOnlyList<StaffSalaryPaymentDto>> GetByStatusAndDateRangeAsync(string? status, int? yearFrom, int? yearTo, int? monthFrom, int? monthTo, CancellationToken ct = default);
    Task<StaffSalaryPaymentDto> CreateAsync(CreateStaffSalaryPaymentRequest request, CancellationToken ct = default);
    Task<StaffSalaryPaymentDto> UpdateAsync(string id, UpdateStaffSalaryPaymentRequest request, CancellationToken ct = default);
    Task<StaffSalaryPaymentLineDto> AddLineAsync(string paymentId, AddStaffSalaryPaymentLineRequest request, CancellationToken ct = default);
    Task<StaffSalaryPaymentLineDto> UpdateLineAsync(string paymentId, string lineId, UpdateStaffSalaryPaymentLineRequest request, CancellationToken ct = default);
    Task DeleteLineAsync(string paymentId, string lineId, CancellationToken ct = default);
}
