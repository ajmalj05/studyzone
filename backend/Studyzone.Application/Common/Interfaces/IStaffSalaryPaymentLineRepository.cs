using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using StaffSalaryPaymentLineEntity = Studyzone.Domain.Entities.StaffSalaryPaymentLine;

namespace Studyzone.Application.Common.Interfaces;

public interface IStaffSalaryPaymentLineRepository
{
    Task<StaffSalaryPaymentLineEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<StaffSalaryPaymentLineEntity>> GetByPaymentIdAsync(Guid staffSalaryPaymentId, CancellationToken ct = default);
    Task<StaffSalaryPaymentLineEntity> AddAsync(StaffSalaryPaymentLineEntity entity, CancellationToken ct = default);
    Task<StaffSalaryPaymentLineEntity> UpdateAsync(StaffSalaryPaymentLineEntity entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
