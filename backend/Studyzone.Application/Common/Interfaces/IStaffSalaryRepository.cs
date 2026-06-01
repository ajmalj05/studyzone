using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using StaffSalaryEntity = Studyzone.Domain.Entities.StaffSalary;

namespace Studyzone.Application.Common.Interfaces;

public interface IStaffSalaryRepository
{
    Task<StaffSalaryEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<StaffSalaryEntity>> GetByStaffAsync(Guid staffUserId, CancellationToken ct = default);
    Task<StaffSalaryEntity?> GetCurrentForStaffAsync(Guid staffUserId, CancellationToken ct = default);
    Task<StaffSalaryEntity> AddAsync(StaffSalaryEntity entity, CancellationToken ct = default);
    Task<StaffSalaryEntity> UpdateAsync(StaffSalaryEntity entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
