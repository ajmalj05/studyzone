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
        string? academicYearName = null;
        if (e.ClassId != Guid.Empty)
        {
            var c = await _classRepo.GetByIdAsync(e.ClassId, ct);
            className = c?.Name ?? "";
        }
        var ay = await _academicYearRepo.GetByIdAsync(e.AcademicYearId, ct);
        if (ay != null) academicYearName = ay.Name;
        return new FeeStructureDto
        {
            Id = e.Id.ToString(),
            ClassId = e.ClassId.ToString(),
            ClassName = className,
            AcademicYearId = e.AcademicYearId.ToString(),
            AcademicYearName = academicYearName,
            Name = e.Name,
            Amount = e.Amount,
            Frequency = e.Frequency,
            EffectiveFrom = e.EffectiveFrom
        };
    }

    public async Task<IReadOnlyList<FeeStructureDto>> GetStructuresByClassAsync(string classId, string? academicYearId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(classId, out var cid)) return Array.Empty<FeeStructureDto>();
        var yearId = await ResolveAcademicYearIdAsync(academicYearId, ct);
        if (yearId == null) return Array.Empty<FeeStructureDto>();
        var list = await _structureRepo.GetByClassIdAndAcademicYearAsync(cid, yearId.Value, ct);
        var c = await _classRepo.GetByIdAsync(cid, ct);
        var ay = await _academicYearRepo.GetByIdAsync(yearId.Value, ct);
        var className = c?.Name ?? "";
        var academicYearName = ay?.Name;
        return list.Select(e => new FeeStructureDto
        {
            Id = e.Id.ToString(),
            ClassId = e.ClassId.ToString(),
            ClassName = className,
            AcademicYearId = e.AcademicYearId.ToString(),
            AcademicYearName = academicYearName,
            Name = e.Name,
            Amount = e.Amount,
            Frequency = e.Frequency,
            EffectiveFrom = e.EffectiveFrom
        }).ToList();
    }

    public async Task<IReadOnlyList<FeeStructureDto>> GetAllStructuresAsync(string? academicYearId, CancellationToken ct = default)
    {
        var yearId = await ResolveAcademicYearIdAsync(academicYearId, ct);
        var list = yearId.HasValue
            ? await _structureRepo.GetByAcademicYearAsync(yearId.Value, ct)
            : await _structureRepo.GetAllAsync(ct);
        var dtos = new List<FeeStructureDto>();
        foreach (var e in list)
        {
            var c = await _classRepo.GetByIdAsync(e.ClassId, ct);
            var ay = await _academicYearRepo.GetByIdAsync(e.AcademicYearId, ct);
            dtos.Add(new FeeStructureDto
            {
                Id = e.Id.ToString(),
                ClassId = e.ClassId.ToString(),
                ClassName = c?.Name ?? "",
                AcademicYearId = e.AcademicYearId.ToString(),
                AcademicYearName = ay?.Name,
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
        var academicYearId = await ResolveAcademicYearIdAsync(
            string.IsNullOrWhiteSpace(request.AcademicYearId) ? null : request.AcademicYearId, ct)
            ?? throw new InvalidOperationException("Academic year is required. Set current academic year in settings.");
        var entity = new FeeStructure
        {
            Id = Guid.NewGuid(),
            ClassId = classId,
            AcademicYearId = academicYearId,
            Name = request.Name,
            Amount = request.Amount,
            Frequency = request.Frequency,
            EffectiveFrom = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _structureRepo.AddAsync(entity, ct);
        var c = await _classRepo.GetByIdAsync(classId, ct);
        var ay = await _academicYearRepo.GetByIdAsync(academicYearId, ct);
        return new FeeStructureDto
        {
            Id = added.Id.ToString(),
            ClassId = added.ClassId.ToString(),
            ClassName = c?.Name ?? "",
            AcademicYearId = added.AcademicYearId.ToString(),
            AcademicYearName = ay?.Name,
            Name = added.Name,
            Amount = added.Amount,
            Frequency = added.Frequency,
            EffectiveFrom = added.EffectiveFrom
        };
    }

    private async Task<Guid?> ResolveAcademicYearIdAsync(string? academicYearId, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(academicYearId) && Guid.TryParse(academicYearId, out var id))
            return id;
        var current = await _academicYearRepo.GetCurrentAsync(ct);
        return current?.Id;
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

        var structureIds = charges.Select(c => c.FeeStructureId).Distinct().ToList();
        var structureNames = new Dictionary<Guid, string>();
        foreach (var structId in structureIds)
        {
            var s = await _structureRepo.GetByIdAsync(structId, ct);
            if (s != null)
                structureNames[structId] = s.Name;
        }

        return new FeeLedgerDto
        {
            StudentId = studentId,
            StudentName = student.Name,
            ClassName = className,
            TotalCharges = totalCharges,
            TotalPayments = totalPayments,
            Balance = totalCharges - totalPayments,
            FeePaymentStartMonth = enr?.FeePaymentStartMonth,
            FeePaymentStartYear = enr?.FeePaymentStartYear,
            Charges = charges.Select(x => new FeeChargeDto
            {
                Id = x.Id.ToString(),
                Period = x.Period,
                Amount = x.Amount,
                Description = x.Description,
                ParticularName = structureNames.TryGetValue(x.FeeStructureId, out var name) ? name : null
            }).ToList(),
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

    private static string GetFeeTermLabel(DateTime paidAt)
    {
        var month = paidAt.Month;
        if (month <= 4) return "Term 1";
        if (month <= 8) return "Term 2";
        return "Term 3";
    }

    public async Task<FeeReceiptDto?> GetReceiptAsync(string paymentId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(paymentId, out var pid))
            return null;

        var payment = await _paymentRepo.GetByIdAsync(pid, ct);
        if (payment == null)
            return null;

        var student = await _studentRepo.GetByIdAsync(payment.StudentId, ct);
        if (student == null)
            return null;

        var enrollment = await _enrollmentRepo.GetCurrentForStudentAsync(student.Id, ct);
        string? className = null;
        Guid? classId = null;
        Guid? academicYearId = null;
        if (enrollment != null)
        {
            classId = enrollment.ClassId;
            academicYearId = enrollment.AcademicYearId;
            if (enrollment.ClassId.HasValue)
            {
                var cls = await _classRepo.GetByIdAsync(enrollment.ClassId.Value, ct);
                className = cls?.Name;
            }
        }

        // Receipt is for this single payment only (one fee payment, not full ledger)
        var particulars = new List<FeeReceiptParticularDto>
        {
            new FeeReceiptParticularDto { Name = "Fees paid", Amount = payment.Amount }
        };

        var history = new List<FeeReceiptHistoryItemDto>
        {
            new FeeReceiptHistoryItemDto
            {
                PaymentId = payment.Id.ToString(),
                ReceiptNumber = payment.ReceiptNumber,
                SubmissionDate = payment.PaidAt,
                FeeTerm = GetFeeTermLabel(payment.PaidAt),
                TotalAmount = payment.Amount,
                Deposit = payment.Amount,
                Due = 0
            }
        };

        return new FeeReceiptDto
        {
            PaymentId = payment.Id.ToString(),
            StudentId = student.Id.ToString(),
            StudentName = student.Name,
            AdmissionNumber = string.IsNullOrWhiteSpace(enrollment?.AdmissionNumber) ? student.AdmissionNumber : enrollment!.AdmissionNumber,
            GuardianName = student.GuardianName,
            ClassName = className,
            ReceiptNumber = payment.ReceiptNumber,
            PaidAt = payment.PaidAt,
            FeeTerm = GetFeeTermLabel(payment.PaidAt),
            CurrencySymbol = "₹",
            TotalCharges = payment.Amount,
            TotalPayments = payment.Amount,
            Balance = 0,
            Deposit = payment.Amount,
            RemainingBalance = 0,
            Particulars = particulars,
            History = history
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

    public async Task<IReadOnlyList<FeeLedgerDto>> GetOutstandingByClassAsync(string? classId, string? academicYearId, CancellationToken ct = default)
    {
        var yearId = await ResolveAcademicYearIdAsync(academicYearId, ct);
        if (yearId == null) return new List<FeeLedgerDto>();
        Guid? cid = string.IsNullOrWhiteSpace(classId) || !Guid.TryParse(classId, out var g) ? null : g;
        var enrollments = await _enrollmentRepo.GetByAcademicYearAsync(yearId.Value, cid, null, "Active", 0, 500, ct);
        var result = new List<FeeLedgerDto>();
        foreach (var enr in enrollments)
        {
            var ledger = await GetLedgerAsync(enr.StudentId.ToString(), null, null, ct);
            if (ledger.Balance > 0)
            {
                ledger.FeePaymentStartMonth = enr.FeePaymentStartMonth;
                ledger.FeePaymentStartYear = enr.FeePaymentStartYear;
                result.Add(ledger);
            }
        }
        return result.OrderByDescending(x => x.Balance).ToList();
    }

    public async Task<IReadOnlyList<FeeLedgerDto>> RecalculateOutstandingAsync(string? classId, string? academicYearId, CancellationToken ct = default)
    {
        var yearId = await ResolveAcademicYearIdAsync(academicYearId, ct);
        if (yearId == null)
            return new List<FeeLedgerDto>();

        Guid? cid = string.IsNullOrWhiteSpace(classId) || !Guid.TryParse(classId, out var g) ? null : g;
        var enrollments = await _enrollmentRepo.GetByAcademicYearAsync(yearId.Value, cid, null, "Active", 0, 500, ct);

        var now = DateTime.UtcNow;
        foreach (var enr in enrollments)
        {
            var generateRequest = new GenerateChargesRequest
            {
                StudentId = enr.StudentId.ToString(),
                AcademicYearId = yearId.Value.ToString(),
                UpToYear = now.Year,
                UpToMonth = now.Month
            };

            await GenerateChargesForStudentAsync(generateRequest, ct);
        }

        return await GetOutstandingByClassAsync(classId, academicYearId, ct);
    }

    public async Task<GenerateChargesResult> GenerateChargesForStudentAsync(GenerateChargesRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.StudentId) || !Guid.TryParse(request.StudentId, out var studentId))
            throw new ArgumentException("Invalid student id.", nameof(request));

        var yearId = await ResolveAcademicYearIdAsync(request.AcademicYearId, ct);
        StudentEnrollment? enr;
        if (yearId.HasValue)
            enr = await _enrollmentRepo.GetByStudentAndAcademicYearAsync(studentId, yearId.Value, ct);
        else
            enr = await _enrollmentRepo.GetCurrentForStudentAsync(studentId, ct);

        if (enr == null)
            throw new InvalidOperationException("Student has no enrollment for the specified academic year.");
        if (!enr.ClassId.HasValue)
            throw new InvalidOperationException("Student enrollment has no class; cannot determine fee structure.");

        var ay = await _academicYearRepo.GetByIdAsync(enr.AcademicYearId, ct);
        var structures = await _structureRepo.GetByClassIdAndAcademicYearAsync(enr.ClassId.Value, enr.AcademicYearId, ct);
        if (structures.Count == 0)
            return new GenerateChargesResult { ChargesAdded = 0 };

        int startYear, startMonth;
        if (enr.FeePaymentStartYear.HasValue && enr.FeePaymentStartMonth.HasValue && enr.FeePaymentStartMonth >= 1 && enr.FeePaymentStartMonth <= 12)
        {
            startYear = enr.FeePaymentStartYear.Value;
            startMonth = enr.FeePaymentStartMonth.Value;
        }
        else if (enr.FeePaymentStartMonth.HasValue && enr.FeePaymentStartMonth >= 1 && enr.FeePaymentStartMonth <= 12 && ay != null)
        {
            startYear = ay.StartDate.Year;
            startMonth = enr.FeePaymentStartMonth.Value;
        }
        else if (enr.JoinedAt.HasValue)
        {
            startYear = enr.JoinedAt.Value.Year;
            startMonth = enr.JoinedAt.Value.Month;
        }
        else if (ay != null)
        {
            startYear = ay.StartDate.Year;
            startMonth = ay.StartDate.Month;
        }
        else
            return new GenerateChargesResult { ChargesAdded = 0 };

        var now = DateTime.UtcNow;
        int endYear = request.UpToYear ?? now.Year;
        int endMonth = request.UpToMonth ?? now.Month;
        if (endYear < startYear || (endYear == startYear && endMonth < startMonth))
            return new GenerateChargesResult { ChargesAdded = 0 };

        var existingCharges = await _chargeRepo.GetByStudentIdAsync(studentId, null, ct);
        var existingSet = existingCharges.Select(c => (c.FeeStructureId, c.Period)).ToHashSet();

        var oneTimeStructures = structures.Where(s =>
            string.Equals(s.Frequency, "Once", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(s.Frequency, "One-time", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(s.Frequency, "OneTime", StringComparison.OrdinalIgnoreCase)).ToList();

        var recurringStructures = structures.Except(oneTimeStructures).ToList();

        int added = 0;

        if (oneTimeStructures.Count > 0)
        {
            var oneTimePeriod = $"{startYear}-{startMonth:D2}";
            foreach (var structure in oneTimeStructures)
            {
                if (existingSet.Contains((structure.Id, oneTimePeriod)))
                    continue;
                await _chargeRepo.AddAsync(new FeeCharge
                {
                    Id = Guid.NewGuid(),
                    StudentId = studentId,
                    FeeStructureId = structure.Id,
                    Period = oneTimePeriod,
                    Amount = structure.Amount,
                    Description = $"{structure.Name} {oneTimePeriod}",
                    CreatedAt = DateTime.UtcNow
                }, ct);
                existingSet.Add((structure.Id, oneTimePeriod));
                added++;
            }
        }

        structures = recurringStructures;
        for (int y = startYear; y <= endYear; y++)
        {
            int monthStart = (y == startYear) ? startMonth : 1;
            int monthEnd = (y == endYear) ? endMonth : 12;
            for (int m = monthStart; m <= monthEnd; m++)
            {
                var period = $"{y}-{m:D2}";
                foreach (var structure in structures)
                {
                    if (existingSet.Contains((structure.Id, period)))
                        continue;
                    await _chargeRepo.AddAsync(new FeeCharge
                    {
                        Id = Guid.NewGuid(),
                        StudentId = studentId,
                        FeeStructureId = structure.Id,
                        Period = period,
                        Amount = structure.Amount,
                        Description = $"{structure.Name} {period}",
                        CreatedAt = DateTime.UtcNow
                    }, ct);
                    existingSet.Add((structure.Id, period));
                    added++;
                }
            }
        }
        return new GenerateChargesResult { ChargesAdded = added };
    }

    public async Task<AddAdmissionFeeResult> AddAdmissionFeeAsync(AddAdmissionFeeRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.StudentId, out var studentId))
            throw new ArgumentException("Invalid student id.", nameof(request));
        if (request.Amount <= 0)
            throw new ArgumentException("Amount must be greater than zero.", nameof(request));

        var student = await _studentRepo.GetByIdAsync(studentId, ct)
            ?? throw new InvalidOperationException("Student not found.");

        var currentYear = await _academicYearRepo.GetCurrentAsync(ct)
            ?? throw new InvalidOperationException("No academic year is set. Set the current academic year in settings.");

        var structures = await _structureRepo.GetByAcademicYearAsync(currentYear.Id, ct);
        var admissionStructure = structures.FirstOrDefault(s =>
            s.Name.IndexOf("Admission", StringComparison.OrdinalIgnoreCase) >= 0 ||
            string.Equals(s.Frequency, "Once", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(s.Frequency, "One-time", StringComparison.OrdinalIgnoreCase));

        if (admissionStructure == null)
        {
            var classes = await _classRepo.GetAllAsync(ct);
            var firstClass = classes.FirstOrDefault();
            if (firstClass == null)
                throw new InvalidOperationException("No class exists. Create at least one class in the system, then try again.");
            admissionStructure = new FeeStructure
            {
                Id = Guid.NewGuid(),
                ClassId = firstClass.Id,
                AcademicYearId = currentYear.Id,
                Name = "Admission Fee",
                Amount = 0,
                Frequency = "Once",
                EffectiveFrom = DateTime.UtcNow.Date,
                CreatedAt = DateTime.UtcNow
            };
            await _structureRepo.AddAsync(admissionStructure, ct);
        }

        var year = DateTime.UtcNow.Year;
        var period = $"ADM-{year}";
        var existingCharges = await _chargeRepo.GetByStudentIdAsync(studentId, null, ct);
        if (existingCharges.Any(c => c.FeeStructureId == admissionStructure.Id && c.Period == period))
            throw new InvalidOperationException($"Admission fee for {year} is already added for this student.");

        var charge = new FeeCharge
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            FeeStructureId = admissionStructure.Id,
            Period = period,
            Amount = request.Amount,
            Description = $"{admissionStructure.Name} {period}",
            CreatedAt = DateTime.UtcNow
        };
        await _chargeRepo.AddAsync(charge, ct);

        string? paymentId = null;
        string? receiptNumber = null;
        if (request.RecordPayment)
        {
            var paymentRequest = new RecordPaymentRequest
            {
                StudentId = request.StudentId,
                Amount = request.Amount,
                Mode = request.PaymentMode
            };
            var payment = await RecordPaymentAsync(paymentRequest, ct);
            paymentId = payment.Id;
            receiptNumber = payment.ReceiptNumber;
        }

        return new AddAdmissionFeeResult
        {
            ChargeId = charge.Id.ToString(),
            PaymentId = paymentId,
            ReceiptNumber = receiptNumber
        };
    }
}
