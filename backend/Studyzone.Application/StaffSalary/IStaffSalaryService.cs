using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Studyzone.Application.StaffSalary;

public interface IStaffSalaryService
{
    Task<StaffSalaryDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<StaffSalaryDto>> GetByStaffAsync(string staffUserId, CancellationToken ct = default);
    Task<StaffSalaryDto?> GetCurrentForStaffAsync(string staffUserId, CancellationToken ct = default);
    Task<StaffSalaryDto> CreateAsync(CreateStaffSalaryRequest request, CancellationToken ct = default);
    Task<StaffSalaryDto> UpdateAsync(string id, UpdateStaffSalaryRequest request, CancellationToken ct = default);
    Task DeleteAsync(string id, CancellationToken ct = default);
}
