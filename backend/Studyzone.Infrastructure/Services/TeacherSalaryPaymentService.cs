using Studyzone.Application.Administration;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.TeacherSalary;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class TeacherSalaryPaymentService : ITeacherSalaryPaymentService
{
    private readonly ITeacherSalaryPaymentRepository _paymentRepo;
    private readonly ITeacherSalaryPaymentLineRepository _lineRepo;
    private readonly ITeacherSalaryRepository _salaryRepo;
    private readonly IUserRepository _userRepo;
    private readonly IUserManagementService _userService;

    public TeacherSalaryPaymentService(
        ITeacherSalaryPaymentRepository paymentRepo,
        ITeacherSalaryPaymentLineRepository lineRepo,
        ITeacherSalaryRepository salaryRepo,
        IUserRepository userRepo,
        IUserManagementService userService)
    {
        _paymentRepo = paymentRepo;
        _lineRepo = lineRepo;
        _salaryRepo = salaryRepo;
        _userRepo = userRepo;
        _userService = userService;
    }

    public async Task<TeacherSalaryPaymentDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _paymentRepo.GetByIdWithLinesAsync(guid, ct);
        return e == null ? null : await MapToDtoAsync(e, ct);
    }

    public async Task<IReadOnlyList<TeacherSalaryPaymentDto>> GetByTeacherAsync(string teacherUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(teacherUserId, out var guid)) return Array.Empty<TeacherSalaryPaymentDto>();
        var list = await _paymentRepo.GetByTeacherAsync(guid, ct);
        var dtos = new List<TeacherSalaryPaymentDto>();
        foreach (var e in list)
            dtos.Add(await MapToDtoAsync(e, ct));
        return dtos;
    }

    public async Task<IReadOnlyList<TeacherSalaryPaymentDto>> GetByMonthAsync(int year, int month, CancellationToken ct = default)
    {
        var list = await _paymentRepo.GetByMonthAsync(year, month, ct);
        var dtos = new List<TeacherSalaryPaymentDto>();
        foreach (var e in list)
            dtos.Add(await MapToDtoAsync(e, ct));
        return dtos;
    }

    public async Task<IReadOnlyList<TeacherSalaryPaymentDto>> GetByStatusAndDateRangeAsync(string? status, int? yearFrom, int? yearTo, int? monthFrom, int? monthTo, CancellationToken ct = default)
    {
        var list = await _paymentRepo.GetByStatusAndDateRangeAsync(status, yearFrom, yearTo, monthFrom, monthTo, ct);
        var dtos = new List<TeacherSalaryPaymentDto>();
        foreach (var e in list)
            dtos.Add(await MapToDtoAsync(e, ct));
        return dtos;
    }

    public async Task<TeacherSalaryPaymentDto> CreateAsync(CreateTeacherSalaryPaymentRequest request, CancellationToken ct = default)
    {
        if (request.Year < 1 || request.Year > 9999 || request.Month < 1 || request.Month > 12)
            throw new ArgumentException("Invalid year or month.");

        if (!string.IsNullOrWhiteSpace(request.TeacherUserId))
        {
            if (!Guid.TryParse(request.TeacherUserId, out var teacherId))
                throw new ArgumentException("Invalid teacher user id.");
            return await CreateOneAsync(teacherId, request.Year, request.Month, ct);
        }

        var teachers = await _userRepo.GetAllAsync("teacher", ct);
        var created = new List<TeacherSalaryPaymentDto>();
        foreach (var teacher in teachers)
        {
            var exists = await _paymentRepo.ExistsByTeacherAndMonthAsync(teacher.Id, request.Year, request.Month, ct);
            if (exists) continue;
            var currentSalary = await _salaryRepo.GetCurrentForTeacherAsync(teacher.Id, ct);
            if (currentSalary == null) continue;
            var dto = await CreateOneAsync(teacher.Id, request.Year, request.Month, ct);
            created.Add(dto);
        }

        if (created.Count == 0)
            throw new InvalidOperationException("No new payments created. All teachers either have no current salary or already have a payment for this month.");
        return created[0];
    }

    private async Task<TeacherSalaryPaymentDto> CreateOneAsync(Guid teacherUserId, int year, int month, CancellationToken ct)
    {
        var exists = await _paymentRepo.ExistsByTeacherAndMonthAsync(teacherUserId, year, month, ct);
        if (exists)
            throw new InvalidOperationException("A payment for this teacher and month already exists.");

        var currentSalary = await _salaryRepo.GetCurrentForTeacherAsync(teacherUserId, ct)
            ?? throw new InvalidOperationException("Teacher has no current salary record.");

        var entity = new TeacherSalaryPayment
        {
            TeacherUserId = teacherUserId,
            Year = year,
            Month = month,
            BaseAmount = currentSalary.Amount,
            Status = "Draft"
        };
        var added = await _paymentRepo.AddAsync(entity, ct);
        return await GetByIdAsync(added.Id.ToString(), ct) ?? await MapToDtoAsync(added, ct);
    }

    public async Task<TeacherSalaryPaymentDto> UpdateAsync(string id, UpdateTeacherSalaryPaymentRequest request, CancellationToken ct = default)
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

    public async Task<TeacherSalaryPaymentLineDto> AddLineAsync(string paymentId, AddTeacherSalaryPaymentLineRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(paymentId, out var paymentGuid))
            throw new ArgumentException("Invalid payment id.");
        var payment = await _paymentRepo.GetByIdAsync(paymentGuid, ct) ?? throw new ArgumentException("Payment not found.");
        var lineType = request.LineType?.Trim().Equals("Addition", StringComparison.OrdinalIgnoreCase) == true ? "Addition" : "Deduction";
        if (request.Amount < 0)
            throw new ArgumentException("Amount must be positive.");
        var line = new TeacherSalaryPaymentLine
        {
            TeacherSalaryPaymentId = paymentGuid,
            LineType = lineType,
            Description = request.Description ?? string.Empty,
            Amount = request.Amount
        };
        var added = await _lineRepo.AddAsync(line, ct);
        return new TeacherSalaryPaymentLineDto
        {
            Id = added.Id.ToString(),
            LineType = added.LineType,
            Description = added.Description,
            Amount = added.Amount
        };
    }

    public async Task<TeacherSalaryPaymentLineDto> UpdateLineAsync(string paymentId, string lineId, UpdateTeacherSalaryPaymentLineRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(paymentId, out var _) || !Guid.TryParse(lineId, out var lineGuid))
            throw new ArgumentException("Invalid payment or line id.");
        var line = await _lineRepo.GetByIdAsync(lineGuid, ct) ?? throw new ArgumentException("Line not found.");
        if (line.TeacherSalaryPaymentId.ToString() != paymentId)
            throw new ArgumentException("Line does not belong to this payment.");
        line.LineType = request.LineType?.Trim().Equals("Addition", StringComparison.OrdinalIgnoreCase) == true ? "Addition" : "Deduction";
        line.Description = request.Description ?? string.Empty;
        if (request.Amount < 0)
            throw new ArgumentException("Amount must be positive.");
        line.Amount = request.Amount;
        var updated = await _lineRepo.UpdateAsync(line, ct);
        return new TeacherSalaryPaymentLineDto
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
        if (line.TeacherSalaryPaymentId.ToString() != paymentId)
            throw new ArgumentException("Line does not belong to this payment.");
        await _lineRepo.DeleteAsync(lineGuid, ct);
    }

    private async Task<TeacherSalaryPaymentDto> MapToDtoAsync(TeacherSalaryPayment e, CancellationToken ct)
    {
        var lines = e.Lines?.ToList() ?? (await _lineRepo.GetByPaymentIdAsync(e.Id, ct)).ToList();
        var totalAdditions = lines.Where(x => x.LineType == "Addition").Sum(x => x.Amount);
        var totalDeductions = lines.Where(x => x.LineType == "Deduction").Sum(x => x.Amount);
        var netAmount = e.BaseAmount + totalAdditions - totalDeductions;
        string? teacherName = null;
        var user = await _userService.GetByIdAsync(e.TeacherUserId.ToString(), ct);
        if (user != null) teacherName = user.Name;
        return new TeacherSalaryPaymentDto
        {
            Id = e.Id.ToString(),
            TeacherUserId = e.TeacherUserId.ToString(),
            TeacherName = teacherName,
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
            Lines = lines.Select(l => new TeacherSalaryPaymentLineDto
            {
                Id = l.Id.ToString(),
                LineType = l.LineType,
                Description = l.Description,
                Amount = l.Amount
            }).ToList()
        };
    }
}
