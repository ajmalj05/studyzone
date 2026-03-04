using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Expenses;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class SchoolExpenseService : ISchoolExpenseService
{
    private readonly ISchoolExpenseRepository _repo;

    public SchoolExpenseService(ISchoolExpenseRepository repo)
    {
        _repo = repo;
    }

    public async Task<SchoolExpenseDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : MapToDto(e);
    }

    public async Task<IReadOnlyList<SchoolExpenseDto>> GetListAsync(DateTime? dateFrom, DateTime? dateTo, string? category, CancellationToken ct = default)
    {
        var list = await _repo.GetListAsync(dateFrom, dateTo, category, ct);
        return list.Select(MapToDto).ToList();
    }

    public async Task<SchoolExpenseDto> CreateAsync(CreateSchoolExpenseRequest request, CancellationToken ct = default)
    {
        if (request.Amount < 0)
            throw new ArgumentException("Amount must be non-negative.");
        var entity = new SchoolExpense
        {
            Date = request.Date.Date,
            Category = (request.Category ?? string.Empty).Trim(),
            Description = (request.Description ?? string.Empty).Trim(),
            Amount = request.Amount
        };
        var added = await _repo.AddAsync(entity, ct);
        return MapToDto(added);
    }

    public async Task<SchoolExpenseDto> UpdateAsync(string id, UpdateSchoolExpenseRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.");
        var existing = await _repo.GetByIdAsync(guid, ct) ?? throw new ArgumentException("Expense not found.");
        if (request.Date.HasValue)
            existing.Date = request.Date.Value.Date;
        if (request.Category != null)
            existing.Category = request.Category.Trim();
        if (request.Description != null)
            existing.Description = request.Description.Trim();
        if (request.Amount.HasValue)
        {
            if (request.Amount.Value < 0)
                throw new ArgumentException("Amount must be non-negative.");
            existing.Amount = request.Amount.Value;
        }
        var updated = await _repo.UpdateAsync(existing, ct);
        return MapToDto(updated);
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.");
        await _repo.DeleteAsync(guid, ct);
    }

    private static SchoolExpenseDto MapToDto(SchoolExpense e)
    {
        return new SchoolExpenseDto
        {
            Id = e.Id.ToString(),
            Date = e.Date,
            Category = e.Category,
            Description = e.Description,
            Amount = e.Amount,
            CreatedAt = e.CreatedAt
        };
    }
}
