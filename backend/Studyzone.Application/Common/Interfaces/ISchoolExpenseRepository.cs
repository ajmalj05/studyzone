using SchoolExpenseEntity = Studyzone.Domain.Entities.SchoolExpense;

namespace Studyzone.Application.Common.Interfaces;

public interface ISchoolExpenseRepository
{
    Task<SchoolExpenseEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<SchoolExpenseEntity>> GetListAsync(DateTime? dateFrom, DateTime? dateTo, string? category, CancellationToken ct = default);
    Task<SchoolExpenseEntity> AddAsync(SchoolExpenseEntity entity, CancellationToken ct = default);
    Task<SchoolExpenseEntity> UpdateAsync(SchoolExpenseEntity entity, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
