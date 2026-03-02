using Studyzone.Application.Fees;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Notifications;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class FeeService : IFeeService
{
    private readonly IFeeStructureRepository _structureRepo;
    private readonly IFeeChargeRepository _chargeRepo;
    private readonly IPaymentRepository _paymentRepo;
    private readonly IReceiptSequenceRepository _receiptSeqRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IStudentEnrollmentRepository _enrollmentRepo;
    private readonly IAcademicYearRepository _academicYearRepo;
    private readonly IClassRepository _classRepo;
    private readonly INotificationService _notificationService;

    public FeeService(
        IFeeStructureRepository structureRepo,
        IFeeChargeRepository chargeRepo,
        IPaymentRepository paymentRepo,
        IReceiptSequenceRepository receiptSeqRepo,
        IStudentRepository studentRepo,
        IStudentEnrollmentRepository enrollmentRepo,
        IAcademicYearRepository academicYearRepo,
        IClassRepository classRepo,
        INotificationService notificationService)
    {
        _structureRepo = structureRepo;
        _chargeRepo = chargeRepo;
        _paymentRepo = paymentRepo;
        _receiptSeqRepo = receiptSeqRepo;
        _studentRepo = studentRepo;
        _enrollmentRepo = enrollmentRepo;
        _academicYearRepo = academicYearRepo;
        _classRepo = classRepo;
        _notificationService = notificationService;
    }

    public async Task<FeeStructureDto?> GetStructureByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _structureRepo.GetByIdAsync(guid, ct);
        if (e == null) return null;
        var className = "";
        if (e.ClassId != Guid.Empty)
        {
            var c = await _classRepo.GetByIdAsync(e.ClassId, ct);
            className = c?.Name ?? "";
        }
        return new FeeStructureDto
        {
            Id = e.Id.ToString(),
            ClassId = e.ClassId.ToString(),
            ClassName = className,
            Name = e.Name,
            Amount = e.Amount,
            Frequency = e.Frequency,
            EffectiveFrom = e.EffectiveFrom
        };
    }

    public async Task<IReadOnlyList<FeeStructureDto>> GetStructuresByClassAsync(string classId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(classId, out var cid)) return Array.Empty<FeeStructureDto>();
        var list = await _structureRepo.GetByClassIdAsync(cid, ct);
        var className = "";
        var c = await _classRepo.GetByIdAsync(cid, ct);
        if (c != null) className = c.Name;
        return list.Select(e => new FeeStructureDto
        {
            Id = e.Id.ToString(),
            ClassId = e.ClassId.ToString(),
            ClassName = className,
            Name = e.Name,
            Amount = e.Amount,
            Frequency = e.Frequency,
            EffectiveFrom = e.EffectiveFrom
        }).ToList();
    }

    public async Task<IReadOnlyList<FeeStructureDto>> GetAllStructuresAsync(CancellationToken ct = default)
    {
        var list = await _structureRepo.GetAllAsync(ct);
        var dtos = new List<FeeStructureDto>();
        foreach (var e in list)
        {
            var c = await _classRepo.GetByIdAsync(e.ClassId, ct);
            dtos.Add(new FeeStructureDto
            {
                Id = e.Id.ToString(),
                ClassId = e.ClassId.ToString(),
                ClassName = c?.Name ?? "",
                Name = e.Name,
                Amount = e.Amount,
                Frequency = e.Frequency,
                EffectiveFrom = e.EffectiveFrom
            });
        }
        return dtos;
    }

    public async Task<FeeStructureDto> CreateStructureAsync(CreateFeeStructureRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.ClassId, out var classId))
            throw new ArgumentException("Invalid class id.", nameof(request));
        var entity = new FeeStructure
        {
            Id = Guid.NewGuid(),
            ClassId = classId,
            Name = request.Name,
            Amount = request.Amount,
            Frequency = request.Frequency,
            EffectiveFrom = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _structureRepo.AddAsync(entity, ct);
        var c = await _classRepo.GetByIdAsync(classId, ct);
        return new FeeStructureDto
        {
            Id = added.Id.ToString(),
            ClassId = added.ClassId.ToString(),
            ClassName = c?.Name ?? "",
            Name = added.Name,
            Amount = added.Amount,
            Frequency = added.Frequency,
            EffectiveFrom = added.EffectiveFrom
        };
    }

    public async Task AddChargeAsync(AddChargeRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.StudentId, out var studentId))
            throw new ArgumentException("Invalid student id.", nameof(request));
        if (!Guid.TryParse(request.FeeStructureId, out var structureId))
            throw new ArgumentException("Invalid fee structure id.", nameof(request));
        var entity = new FeeCharge
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            FeeStructureId = structureId,
            Period = request.Period,
            Amount = request.Amount,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow
        };
        await _chargeRepo.AddAsync(entity, ct);
    }

    public async Task<FeeLedgerDto> GetLedgerAsync(string studentId, string? periodFrom, string? periodTo, CancellationToken ct = default)
    {
        if (!Guid.TryParse(studentId, out var sid))
            throw new ArgumentException("Invalid student id.", nameof(studentId));
        var student = await _studentRepo.GetByIdAsync(sid, ct);
        if (student == null)
            throw new InvalidOperationException("Student not found.");
        var enr = await _enrollmentRepo.GetCurrentForStudentAsync(sid, ct);
        string? className = null;
        if (enr?.ClassId.HasValue == true)
        {
            var c = await _classRepo.GetByIdAsync(enr.ClassId.Value, ct);
            className = c?.Name;
        }
        var charges = await _chargeRepo.GetByStudentIdAsync(sid, null, ct);
        if (!string.IsNullOrWhiteSpace(periodFrom))
            charges = charges.Where(x => string.Compare(x.Period, periodFrom, StringComparison.Ordinal) >= 0).ToList();
        if (!string.IsNullOrWhiteSpace(periodTo))
            charges = charges.Where(x => string.Compare(x.Period, periodTo, StringComparison.Ordinal) <= 0).ToList();
        var totalCharges = charges.Sum(x => x.Amount);
        var payments = await _paymentRepo.GetByStudentIdAsync(sid, null, null, ct);
        var totalPayments = payments.Sum(x => x.Amount);
        return new FeeLedgerDto
        {
            StudentId = studentId,
            StudentName = student.Name,
            ClassName = className,
            TotalCharges = totalCharges,
            TotalPayments = totalPayments,
            Balance = totalCharges - totalPayments,
            Charges = charges.Select(x => new FeeChargeDto { Id = x.Id.ToString(), Period = x.Period, Amount = x.Amount, Description = x.Description }).ToList(),
            Payments = payments.Select(x => new PaymentDto
            {
                Id = x.Id.ToString(),
                StudentId = x.StudentId.ToString(),
                StudentName = student.Name,
                Amount = x.Amount,
                Mode = x.Mode,
                ReceiptNumber = x.ReceiptNumber,
                PaidAt = x.PaidAt,
                Reference = x.Reference
            }).ToList()
        };
    }

    public async Task<PaymentDto> RecordPaymentAsync(RecordPaymentRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.StudentId, out var studentId))
            throw new ArgumentException("Invalid student id.", nameof(request));
        var student = await _studentRepo.GetByIdAsync(studentId, ct) ?? throw new InvalidOperationException("Student not found.");
        var prefix = "RCP-" + DateTime.UtcNow.ToString("yyyyMM");
        var num = await _receiptSeqRepo.GetNextAsync(prefix, ct);
        var receiptNumber = $"{prefix}-{num:D4}";
        var entity = new Payment
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            Amount = request.Amount,
            Mode = request.Mode,
            ReceiptNumber = receiptNumber,
            PaidAt = DateTime.UtcNow,
            Reference = request.Reference,
            Remarks = request.Remarks,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _paymentRepo.AddAsync(entity, ct);
        await _notificationService.CreateForAdminsAsync("FeePayment", $"Fee payment received from {student.Name}", added.Id, ct);
        return new PaymentDto
        {
            Id = added.Id.ToString(),
            StudentId = added.StudentId.ToString(),
            StudentName = student.Name,
            Amount = added.Amount,
            Mode = added.Mode,
            ReceiptNumber = added.ReceiptNumber,
            PaidAt = added.PaidAt,
            Reference = added.Reference
        };
    }

    public async Task<IReadOnlyList<PaymentDto>> GetPaymentsByStudentAsync(string studentId, DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        if (!Guid.TryParse(studentId, out var sid)) return Array.Empty<PaymentDto>();
        var student = await _studentRepo.GetByIdAsync(sid, ct);
        var list = await _paymentRepo.GetByStudentIdAsync(sid, from, to, ct);
        return list.Select(x => new PaymentDto
        {
            Id = x.Id.ToString(),
            StudentId = x.StudentId.ToString(),
            StudentName = student?.Name ?? "",
            Amount = x.Amount,
            Mode = x.Mode,
            ReceiptNumber = x.ReceiptNumber,
            PaidAt = x.PaidAt,
            Reference = x.Reference
        }).ToList();
    }

    public async Task<IReadOnlyList<FeeLedgerDto>> GetOutstandingByClassAsync(string? classId, CancellationToken ct = default)
    {
        var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
        if (currentYear == null) return new List<FeeLedgerDto>();
        Guid? cid = string.IsNullOrWhiteSpace(classId) || !Guid.TryParse(classId, out var g) ? null : g;
        var enrollments = await _enrollmentRepo.GetByAcademicYearAsync(currentYear.Id, cid, null, "Active", 0, 500, ct);
        var result = new List<FeeLedgerDto>();
        foreach (var enr in enrollments)
        {
            var ledger = await GetLedgerAsync(enr.StudentId.ToString(), null, null, ct);
            if (ledger.Balance > 0)
                result.Add(ledger);
        }
        return result.OrderByDescending(x => x.Balance).ToList();
    }
}
