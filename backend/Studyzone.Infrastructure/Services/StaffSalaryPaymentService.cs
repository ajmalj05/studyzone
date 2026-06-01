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

public class StaffSalaryPaymentService : IStaffSalaryPaymentService
{
    private readonly IStaffSalaryPaymentRepository _paymentRepo;
    private readonly IStaffSalaryPaymentLineRepository _lineRepo;
    private readonly IStaffSalaryRepository _salaryRepo;
    private readonly IUserRepository _userRepo;
    private readonly IUserManagementService _userService;

    public StaffSalaryPaymentService(
        IStaffSalaryPaymentRepository paymentRepo,
        IStaffSalaryPaymentLineRepository lineRepo,
        IStaffSalaryRepository salaryRepo,
        IUserRepository userRepo,
        IUserManagementService userService)
    {
        _paymentRepo = paymentRepo;
        _lineRepo = lineRepo;
        _salaryRepo = salaryRepo;
        _userRepo = userRepo;
        _userService = userService;
    }

    public async Task<StaffSalaryPaymentDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _paymentRepo.GetByIdWithLinesAsync(guid, ct);
        return e == null ? null : await MapToDtoAsync(e, ct);
    }

    public async Task<IReadOnlyList<StaffSalaryPaymentDto>> GetByStaffAsync(string staffUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(staffUserId, out var guid)) return Array.Empty<StaffSalaryPaymentDto>();
        var list = await _paymentRepo.GetByStaffAsync(guid, ct);
        var dtos = new List<StaffSalaryPaymentDto>();
        foreach (var e in list)
            dtos.Add(await MapToDtoAsync(e, ct));
        return dtos;
    }

    public async Task<IReadOnlyList<StaffSalaryPaymentDto>> GetByMonthAsync(int year, int month, CancellationToken ct = default)
    {
        var list = await _paymentRepo.GetByMonthAsync(year, month, ct);
        var dtos = new List<StaffSalaryPaymentDto>();
        foreach (var e in list)
            dtos.Add(await MapToDtoAsync(e, ct));
        return dtos;
    }

    public async Task<IReadOnlyList<StaffSalaryPaymentDto>> GetByStatusAndDateRangeAsync(string? status, int? yearFrom, int? yearTo, int? monthFrom, int? monthTo, CancellationToken ct = default)
    {
        var list = await _paymentRepo.GetByStatusAndDateRangeAsync(status, yearFrom, yearTo, monthFrom, monthTo, ct);
        var dtos = new List<StaffSalaryPaymentDto>();
        foreach (var e in list)
            dtos.Add(await MapToDtoAsync(e, ct));
        return dtos;
    }

    public async Task<StaffSalaryPaymentDto> CreateAsync(CreateStaffSalaryPaymentRequest request, CancellationToken ct = default)
    {
        if (request.Year < 1 || request.Year > 9999 || request.Month < 1 || request.Month > 12)
            throw new ArgumentException("Invalid year or month.");

        if (!string.IsNullOrWhiteSpace(request.StaffUserId))
        {
            if (!Guid.TryParse(request.StaffUserId, out var staffId))
                throw new ArgumentException("Invalid staff user id.");
            return await CreateOneAsync(staffId, request.Year, request.Month, ct);
        }

        var staffs = await _userRepo.GetAllAsync("staff", ct);
        var created = new List<StaffSalaryPaymentDto>();
        foreach (var staff in staffs)
        {
            var exists = await _paymentRepo.ExistsByStaffAndMonthAsync(staff.Id, request.Year, request.Month, ct);
            if (exists) continue;
            var currentSalary = await _salaryRepo.GetCurrentForStaffAsync(staff.Id, ct);
            if (currentSalary == null) continue;
            var dto = await CreateOneAsync(staff.Id, request.Year, request.Month, ct);
            created.Add(dto);
        }

        if (created.Count == 0)
            throw new InvalidOperationException("No new payments created. All staff members either have no current salary or already have a payment for this month.");
        return created[0];
    }

    private async Task<StaffSalaryPaymentDto> CreateOneAsync(Guid staffUserId, int year, int month, CancellationToken ct)
    {
        var exists = await _paymentRepo.ExistsByStaffAndMonthAsync(staffUserId, year, month, ct);
        if (exists)
            throw new InvalidOperationException("A payment for this staff member and month already exists.");

        var currentSalary = await _salaryRepo.GetCurrentForStaffAsync(staffUserId, ct)
            ?? throw new InvalidOperationException("Staff member has no current salary record.");

        var entity = new StaffSalaryPayment
        {
            StaffUserId = staffUserId,
            Year = year,
            Month = month,
            BaseAmount = currentSalary.Amount,
            Status = "Draft"
        };
        var added = await _paymentRepo.AddAsync(entity, ct);
        return await GetByIdAsync(added.Id.ToString(), ct) ?? await MapToDtoAsync(added, ct);
    }

    public async Task<StaffSalaryPaymentDto> UpdateAsync(string id, UpdateStaffSalaryPaymentRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.");
        var existing = await _paymentRepo.GetByIdAsync(guid, ct) ?? throw new ArgumentException("Payment not found.");
        if (!string.IsNullOrWhiteSpace(request.Status))
            existing.Status = request.Status;
        if (request.PaidAt.HasValue)
            existing.PaidAt = request.PaidAt;
        if (request.Notes != null)
            existing.Notes = request.Notes;
        await _paymentRepo.UpdateAsync(existing, ct);
        return (await GetByIdAsync(id, ct))!;
    }

    public async Task<StaffSalaryPaymentLineDto> AddLineAsync(string paymentId, AddStaffSalaryPaymentLineRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(paymentId, out var paymentGuid))
            throw new ArgumentException("Invalid payment id.");
        var payment = await _paymentRepo.GetByIdAsync(paymentGuid, ct) ?? throw new ArgumentException("Payment not found.");
        var lineType = request.LineType?.Trim().Equals("Addition", StringComparison.OrdinalIgnoreCase) == true ? "Addition" : "Deduction";
        if (request.Amount < 0)
            throw new ArgumentException("Amount must be positive.");
        var line = new StaffSalaryPaymentLine
        {
            StaffSalaryPaymentId = paymentGuid,
            LineType = lineType,
            Description = request.Description ?? string.Empty,
            Amount = request.Amount
        };
        var added = await _lineRepo.AddAsync(line, ct);
        return new StaffSalaryPaymentLineDto
        {
            Id = added.Id.ToString(),
            LineType = added.LineType,
            Description = added.Description,
            Amount = added.Amount
        };
    }

    public async Task<StaffSalaryPaymentLineDto> UpdateLineAsync(string paymentId, string lineId, UpdateStaffSalaryPaymentLineRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(paymentId, out var _) || !Guid.TryParse(lineId, out var lineGuid))
            throw new ArgumentException("Invalid payment or line id.");
        var line = await _lineRepo.GetByIdAsync(lineGuid, ct) ?? throw new ArgumentException("Line not found.");
        if (line.StaffSalaryPaymentId.ToString() != paymentId)
            throw new ArgumentException("Line does not belong to this payment.");
        line.LineType = request.LineType?.Trim().Equals("Addition", StringComparison.OrdinalIgnoreCase) == true ? "Addition" : "Deduction";
        line.Description = request.Description ?? string.Empty;
        if (request.Amount < 0)
            throw new ArgumentException("Amount must be positive.");
        line.Amount = request.Amount;
        var updated = await _lineRepo.UpdateAsync(line, ct);
        return new StaffSalaryPaymentLineDto
        {
            Id = updated.Id.ToString(),
            LineType = updated.LineType,
            Description = updated.Description,
            Amount = updated.Amount
        };
    }

    public async Task DeleteLineAsync(string paymentId, string lineId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(lineId, out var lineGuid))
            throw new ArgumentException("Invalid line id.");
        var line = await _lineRepo.GetByIdAsync(lineGuid, ct) ?? throw new ArgumentException("Line not found.");
        if (line.StaffSalaryPaymentId.ToString() != paymentId)
            throw new ArgumentException("Line does not belong to this payment.");
        await _lineRepo.DeleteAsync(lineGuid, ct);
    }

    private async Task<StaffSalaryPaymentDto> MapToDtoAsync(StaffSalaryPayment e, CancellationToken ct)
    {
        var lines = e.Lines?.ToList() ?? (await _lineRepo.GetByPaymentIdAsync(e.Id, ct)).ToList();
        var totalAdditions = lines.Where(x => x.LineType == "Addition").Sum(x => x.Amount);
        var totalDeductions = lines.Where(x => x.LineType == "Deduction").Sum(x => x.Amount);
        var netAmount = e.BaseAmount + totalAdditions - totalDeductions;
        string? staffName = null;
        var user = await _userService.GetByIdAsync(e.StaffUserId.ToString(), ct);
        if (user != null) staffName = user.Name;
        return new StaffSalaryPaymentDto
        {
            Id = e.Id.ToString(),
            StaffUserId = e.StaffUserId.ToString(),
            StaffName = staffName,
            Year = e.Year,
            Month = e.Month,
            BaseAmount = e.BaseAmount,
            TotalAdditions = totalAdditions,
            TotalDeductions = totalDeductions,
            NetAmount = netAmount,
            Status = e.Status,
            PaidAt = e.PaidAt,
            Notes = e.Notes,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt,
            Lines = lines.Select(l => new StaffSalaryPaymentLineDto
            {
                Id = l.Id.ToString(),
                LineType = l.LineType,
                Description = l.Description,
                Amount = l.Amount
            }).ToList()
        };
    }
}
