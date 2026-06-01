using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Studyzone.Application.Administration;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.StaffSalary;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class StaffSalaryService : IStaffSalaryService
{
    private readonly IStaffSalaryRepository _repo;
    private readonly IUserManagementService _userService;

    private static string NormalizeCurrency(string? currency) =>
        string.Equals(currency, "INR", StringComparison.OrdinalIgnoreCase) ? "AED" : (currency ?? "AED");

    public StaffSalaryService(IStaffSalaryRepository repo, IUserManagementService userService)
    {
        _repo = repo;
        _userService = userService;
    }

    public async Task<StaffSalaryDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : await MapAsync(e, ct);
    }

    public async Task<IReadOnlyList<StaffSalaryDto>> GetByStaffAsync(string staffUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(staffUserId, out var guid)) return Array.Empty<StaffSalaryDto>();
        var list = await _repo.GetByStaffAsync(guid, ct);
        var dtos = new List<StaffSalaryDto>();
        foreach (var e in list)
            dtos.Add(await MapAsync(e, ct));
        return dtos;
    }

    public async Task<StaffSalaryDto?> GetCurrentForStaffAsync(string staffUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(staffUserId, out var guid)) return null;
        var e = await _repo.GetCurrentForStaffAsync(guid, ct);
        return e == null ? null : await MapAsync(e, ct);
    }

    public async Task<StaffSalaryDto> CreateAsync(CreateStaffSalaryRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.StaffUserId, out var staffId))
            throw new ArgumentException("Invalid staff user id.");
        var effectiveFrom = request.EffectiveFrom.Date;
        var effectiveTo = request.EffectiveTo?.Date;
        if (effectiveTo.HasValue && effectiveTo.Value < effectiveFrom)
            throw new ArgumentException("Effective to date must be on or after effective from date.");
        if (request.Amount <= 0)
            throw new ArgumentException("Salary amount must be greater than zero.");

        var existingRows = await _repo.GetByStaffAsync(staffId, ct);
        var openPrevious = existingRows.FirstOrDefault(x =>
            x.EffectiveFrom < effectiveFrom &&
            (x.EffectiveTo == null || x.EffectiveTo.Value >= effectiveFrom));
        if (openPrevious != null)
        {
            openPrevious.EffectiveTo = effectiveFrom.AddDays(-1);
            await _repo.UpdateAsync(openPrevious, ct);
            existingRows = await _repo.GetByStaffAsync(staffId, ct);
        }

        if (HasOverlap(existingRows, effectiveFrom, effectiveTo))
            throw new ArgumentException("Salary effective date range overlaps with an existing salary record.");

        var entity = new StaffSalary
        {
            StaffUserId = staffId,
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

    public async Task<StaffSalaryDto> UpdateAsync(string id, UpdateStaffSalaryRequest request, CancellationToken ct = default)
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

        var rows = await _repo.GetByStaffAsync(existing.StaffUserId, ct);
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

    private async Task<StaffSalaryDto> MapAsync(StaffSalary e, CancellationToken ct)
    {
        string? staffName = null;
        var user = await _userService.GetByIdAsync(e.StaffUserId.ToString(), ct);
        if (user != null) staffName = user.Name;
        return new StaffSalaryDto
        {
            Id = e.Id.ToString(),
            StaffUserId = e.StaffUserId.ToString(),
            StaffName = staffName,
            EffectiveFrom = e.EffectiveFrom,
            EffectiveTo = e.EffectiveTo,
            Amount = e.Amount,
            PayFrequency = e.PayFrequency,
            Currency = NormalizeCurrency(e.Currency),
            Notes = e.Notes,
            CreatedAt = e.CreatedAt
        };
    }

    private static bool HasOverlap(IEnumerable<StaffSalary> rows, DateTime effectiveFrom, DateTime? effectiveTo)
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
