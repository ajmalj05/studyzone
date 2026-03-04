namespace Studyzone.Application.Expenses;

public interface ISchoolExpenseService
{
    Task<SchoolExpenseDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<SchoolExpenseDto>> GetListAsync(DateTime? dateFrom, DateTime? dateTo, string? category, CancellationToken ct = default);
    Task<SchoolExpenseDto> CreateAsync(CreateSchoolExpenseRequest request, CancellationToken ct = default);
    Task<SchoolExpenseDto> UpdateAsync(string id, UpdateSchoolExpenseRequest request, CancellationToken ct = default);
    Task DeleteAsync(string id, CancellationToken ct = default);
}
