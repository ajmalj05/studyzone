using Studyzone.Application.Administration;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.TeacherSalary;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class TeacherSalaryService : ITeacherSalaryService
{
    private readonly ITeacherSalaryRepository _repo;
    private readonly IUserManagementService _userService;
    private static string NormalizeCurrency(string? currency) =>
        string.Equals(currency, "INR", StringComparison.OrdinalIgnoreCase) ? "AED" : (currency ?? "AED");

    public TeacherSalaryService(ITeacherSalaryRepository repo, IUserManagementService userService)
    {
        _repo = repo;
        _userService = userService;
    }

    public async Task<TeacherSalaryDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : await MapAsync(e, ct);
    }

    public async Task<IReadOnlyList<TeacherSalaryDto>> GetByTeacherAsync(string teacherUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(teacherUserId, out var guid)) return Array.Empty<TeacherSalaryDto>();
        var list = await _repo.GetByTeacherAsync(guid, ct);
        var dtos = new List<TeacherSalaryDto>();
        foreach (var e in list)
            dtos.Add(await MapAsync(e, ct));
        return dtos;
    }

    public async Task<TeacherSalaryDto?> GetCurrentForTeacherAsync(string teacherUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(teacherUserId, out var guid)) return null;
        var e = await _repo.GetCurrentForTeacherAsync(guid, ct);
        return e == null ? null : await MapAsync(e, ct);
    }

    public async Task<TeacherSalaryDto> CreateAsync(CreateTeacherSalaryRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.TeacherUserId, out var teacherId))
            throw new ArgumentException("Invalid teacher user id.");
        var effectiveFrom = request.EffectiveFrom.Date;
        var effectiveTo = request.EffectiveTo?.Date;
        if (effectiveTo.HasValue && effectiveTo.Value < effectiveFrom)
            throw new ArgumentException("Effective to date must be on or after effective from date.");
        if (request.Amount <= 0)
            throw new ArgumentException("Salary amount must be greater than zero.");

        var existingRows = await _repo.GetByTeacherAsync(teacherId, ct);
        var openPrevious = existingRows.FirstOrDefault(x =>
            x.EffectiveFrom < effectiveFrom &&
            (x.EffectiveTo == null || x.EffectiveTo.Value >= effectiveFrom));
        if (openPrevious != null)
        {
            openPrevious.EffectiveTo = effectiveFrom.AddDays(-1);
            await _repo.UpdateAsync(openPrevious, ct);
            existingRows = await _repo.GetByTeacherAsync(teacherId, ct);
        }

        if (HasOverlap(existingRows, effectiveFrom, effectiveTo))
            throw new ArgumentException("Salary effective date range overlaps with an existing salary record.");

        var entity = new Domain.Entities.TeacherSalary
        {
            TeacherUserId = teacherId,
            EffectiveFrom = effectiveFrom,
            EffectiveTo = effectiveTo,
            Amount = request.Amount,
            PayFrequency = request.PayFrequency ?? "Monthly",
            Currency = NormalizeCurrency(request.Currency),
            Notes = request.Notes
        };
        var added = await _repo.AddAsync(entity, ct);
        return (await MapAsync(added, ct))!;
    }

    public async Task<TeacherSalaryDto> UpdateAsync(string id, UpdateTeacherSalaryRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.");
        var existing = await _repo.GetByIdAsync(guid, ct) ?? throw new ArgumentException("Salary record not found.");
        var effectiveFrom = request.EffectiveFrom.Date;
        var effectiveTo = request.EffectiveTo?.Date;
        if (effectiveTo.HasValue && effectiveTo.Value < effectiveFrom)
            throw new ArgumentException("Effective to date must be on or after effective from date.");
        if (request.Amount <= 0)
            throw new ArgumentException("Salary amount must be greater than zero.");

        var rows = await _repo.GetByTeacherAsync(existing.TeacherUserId, ct);
        if (HasOverlap(rows.Where(x => x.Id != existing.Id), effectiveFrom, effectiveTo))
            throw new ArgumentException("Salary effective date range overlaps with an existing salary record.");

        existing.EffectiveFrom = effectiveFrom;
        existing.EffectiveTo = effectiveTo;
        existing.Amount = request.Amount;
        existing.PayFrequency = request.PayFrequency ?? "Monthly";
        existing.Currency = NormalizeCurrency(request.Currency);
        existing.Notes = request.Notes;
        var updated = await _repo.UpdateAsync(existing, ct);
        return (await MapAsync(updated, ct))!;
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.");
        await _repo.DeleteAsync(guid, ct);
    }

    private async Task<TeacherSalaryDto> MapAsync(Domain.Entities.TeacherSalary e, CancellationToken ct)
    {
        string? teacherName = null;
        var user = await _userService.GetByIdAsync(e.TeacherUserId.ToString(), ct);
        if (user != null) teacherName = user.Name;
        return new TeacherSalaryDto
        {
            Id = e.Id.ToString(),
            TeacherUserId = e.TeacherUserId.ToString(),
            TeacherName = teacherName,
            EffectiveFrom = e.EffectiveFrom,
            EffectiveTo = e.EffectiveTo,
            Amount = e.Amount,
            PayFrequency = e.PayFrequency,
            Currency = NormalizeCurrency(e.Currency),
            Notes = e.Notes,
            CreatedAt = e.CreatedAt
        };
    }

    private static bool HasOverlap(IEnumerable<Domain.Entities.TeacherSalary> rows, DateTime effectiveFrom, DateTime? effectiveTo)
    {
        var newEnd = effectiveTo ?? DateTime.MaxValue.Date;
        foreach (var row in rows)
        {
            var rowStart = row.EffectiveFrom.Date;
            var rowEnd = row.EffectiveTo?.Date ?? DateTime.MaxValue.Date;
            if (effectiveFrom <= rowEnd && rowStart <= newEnd)
                return true;
        }
        return false;
    }
}
