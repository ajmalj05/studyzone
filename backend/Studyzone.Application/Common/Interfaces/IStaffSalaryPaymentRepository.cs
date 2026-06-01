using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using StaffSalaryPaymentEntity = Studyzone.Domain.Entities.StaffSalaryPayment;

namespace Studyzone.Application.Common.Interfaces;

public interface IStaffSalaryPaymentRepository
{
    Task<StaffSalaryPaymentEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<StaffSalaryPaymentEntity?> GetByIdWithLinesAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<StaffSalaryPaymentEntity>> GetByStaffAsync(Guid staffUserId, CancellationToken ct = default);
    Task<IReadOnlyList<StaffSalaryPaymentEntity>> GetByMonthAsync(int year, int month, CancellationToken ct = default);
    Task<IReadOnlyList<StaffSalaryPaymentEntity>> GetByStatusAndDateRangeAsync(string? status, int? yearFrom, int? yearTo, int? monthFrom, int? monthTo, CancellationToken ct = default);
    Task<bool> ExistsByStaffAndMonthAsync(Guid staffUserId, int year, int month, CancellationToken ct = default);
    Task<StaffSalaryPaymentEntity> AddAsync(StaffSalaryPaymentEntity entity, CancellationToken ct = default);
    Task<StaffSalaryPaymentEntity> UpdateAsync(StaffSalaryPaymentEntity entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
