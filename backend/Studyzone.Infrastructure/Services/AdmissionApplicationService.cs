using System.Text.Json;
using Studyzone.Application.Administration;
using Studyzone.Application.Admission;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Students;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class AdmissionApplicationService : IApplicationService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly IApplicationRepository _appRepo;
    private readonly IAdmissionApprovalRepository _approvalRepo;
    private readonly IAdmissionNumberGenerator _numberGen;
    private readonly IAcademicYearRepository _yearRepo;
    private readonly IAuditLogService _audit;
    private readonly IStudentService _studentService;

    public AdmissionApplicationService(
        IApplicationRepository appRepo,
        IAdmissionApprovalRepository approvalRepo,
        IAdmissionNumberGenerator numberGen,
        IAcademicYearRepository yearRepo,
        IAuditLogService audit,
        IStudentService studentService)
    {
        _appRepo = appRepo;
        _approvalRepo = approvalRepo;
        _numberGen = numberGen;
        _yearRepo = yearRepo;
        _audit = audit;
        _studentService = studentService;
    }

    public async Task<ApplicationDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _appRepo.GetByIdAsync(guid, ct);
        return e == null ? null : Map(e);
    }

    public async Task<(IReadOnlyList<ApplicationDto> Items, int Total)> GetAllAsync(string? statusFilter, string? classId, string? batchId, int skip, int take, CancellationToken ct = default)
    {
        var list = await _appRepo.GetAllAsync(statusFilter, classId, batchId, skip, take, ct);
        var total = await _appRepo.CountAsync(statusFilter, classId, batchId, ct);
        return (list.Select(Map).ToList(), total);
    }

    public async Task<ApplicationDto> CreateAsync(CreateApplicationRequest request, CancellationToken ct = default)
    {
        var entity = MapToEntity(request);
        entity.Id = Guid.NewGuid();
        entity.Status = "Draft";
        entity.CreatedAt = DateTime.UtcNow;
        var added = await _appRepo.AddAsync(entity, ct);
        return Map(added);
    }

    public async Task<ApplicationDto> UpdateAsync(string id, UpdateApplicationRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _appRepo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Application not found.");
        MapToEntity(request, entity);
        await _appRepo.UpdateAsync(entity, ct);
        return Map(entity);
    }

    public async Task<ApplicationDto> SubmitForApprovalAsync(string id, SubmitForApprovalRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _appRepo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Application not found.");
        if (entity.Status != "Draft" && entity.Status != "Submitted")
            throw new InvalidOperationException("Application cannot be submitted for approval.");
        entity.Status = "PendingApproval";
        entity.Batch = request.Batch;
        entity.Section = request.Section;
        await _appRepo.UpdateAsync(entity, ct);

        var existing = await _approvalRepo.GetByApplicationIdAsync(guid, ct);
        if (existing == null)
        {
            await _approvalRepo.AddAsync(new AdmissionApproval
            {
                Id = Guid.NewGuid(),
                ApplicationId = guid,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            }, ct);
        }
        return Map(entity);
    }

    public async Task<(IReadOnlyList<ApplicationDto> Items, int Total)> GetPendingApprovalsAsync(int skip, int take, CancellationToken ct = default)
    {
        var pending = await _approvalRepo.GetPendingAsync(skip, take, ct);
        var total = await _approvalRepo.CountPendingAsync(ct);
        var apps = new List<ApplicationDto>();
        foreach (var p in pending)
        {
            var app = await _appRepo.GetByIdAsync(p.ApplicationId, ct);
            if (app != null) apps.Add(Map(app));
        }
        return (apps, total);
    }

    public async Task<ApplicationDto> ApproveOrRejectAsync(string id, ApprovalDecisionRequest request, string approvedByUserId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var app = await _appRepo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Application not found.");
        var approval = await _approvalRepo.GetByApplicationIdAsync(guid, ct) ?? throw new InvalidOperationException("Approval record not found.");
        if (approval.Status != "Pending")
            throw new InvalidOperationException("Already processed.");

        approval.Status = request.Status;
        approval.Reason = request.Reason;
        approval.ApprovedByUserId = Guid.TryParse(approvedByUserId, out var uid) ? uid : null;
        approval.ApprovedAt = DateTime.UtcNow;
        await _approvalRepo.UpdateAsync(approval, ct);

        if (request.Status == "Approved")
        {
            if (!string.IsNullOrWhiteSpace(request.ClassId) && Guid.TryParse(request.ClassId, out var reqClassId))
                app.ClassId = reqClassId;
            if (!string.IsNullOrWhiteSpace(request.BatchId) && Guid.TryParse(request.BatchId, out var reqBatchId))
                app.BatchId = reqBatchId;
            var currentYear = await _yearRepo.GetCurrentAsync(ct);
            var yearName = currentYear?.Name ?? DateTime.UtcNow.Year.ToString();
            var classCode = app.ClassApplied ?? "G";
            app.AdmissionNumber = await _numberGen.GenerateNextAsync(yearName, classCode, ct);
            app.Status = "Approved";
        }
        else
        {
            app.Status = "Rejected";
        }
        await _appRepo.UpdateAsync(app, ct);
        await _audit.LogAsync(approvedByUserId, null, "Application", request.Status, id, request.Reason, ct);
        return Map(app);
    }

    public async Task<ApplicationDto> SubmitAndEnrollAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var app = await _appRepo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Application not found.");
        if (app.Status == "Approved" && !string.IsNullOrEmpty(app.AdmissionNumber))
            throw new InvalidOperationException("Application already enrolled.");

        ValidateRequiredForEnrollment(app);

        var currentYear = await _yearRepo.GetCurrentAsync(ct);
        var yearName = currentYear?.Name ?? DateTime.UtcNow.Year.ToString();
        var classCode = app.ClassApplied ?? "G";
        var admissionNumber = await _numberGen.GenerateNextAsync(yearName, classCode, ct);

        app.AdmissionNumber = admissionNumber;
        app.Status = "Approved";
        if (app.ClassId == null || app.BatchId == null)
        {
            // Keep as-is if already set; otherwise caller must set Class/Batch before calling
        }
        await _appRepo.UpdateAsync(app, ct);

        var createStudent = new CreateStudentRequest
        {
            AdmissionNumber = admissionNumber,
            Name = app.StudentName,
            DateOfBirth = app.DateOfBirth,
            Gender = app.Gender,
            ClassId = app.ClassId?.ToString(),
            BatchId = app.BatchId?.ToString(),
            Section = app.Section,
            GuardianName = app.FatherNameAsInPassport ?? app.GuardianName,
            GuardianPhone = app.FatherMobileNumber ?? app.GuardianPhone,
            GuardianEmail = app.FatherEmailAddress ?? app.GuardianEmail,
            Address = app.FatherAddressOfResidence
        };
        await _studentService.CreateAsync(createStudent, ct);
        return Map(app);
    }

    private static void ValidateRequiredForEnrollment(Domain.Entities.Application app)
    {
        if (string.IsNullOrWhiteSpace(app.StudentName)) throw new ArgumentException("Student name is required.");
        if (string.IsNullOrWhiteSpace(app.FatherNameAsInPassport)) throw new ArgumentException("Father name (as in passport) is required.");
        if (string.IsNullOrWhiteSpace(app.FatherMobileNumber)) throw new ArgumentException("Father mobile number is required.");
        if (string.IsNullOrWhiteSpace(app.FatherEmailAddress)) throw new ArgumentException("Father email is required.");
        if (string.IsNullOrWhiteSpace(app.MotherNameAsInPassport)) throw new ArgumentException("Mother name (as in passport) is required.");
        if (string.IsNullOrWhiteSpace(app.MotherMobileNumber)) throw new ArgumentException("Mother mobile number is required.");
        if (string.IsNullOrWhiteSpace(app.MotherEmailAddress)) throw new ArgumentException("Mother email is required.");
    }

    private static Domain.Entities.Application MapToEntity(CreateApplicationRequest request)
    {
        var e = new Domain.Entities.Application();
        MapToEntityCore(request, e);
        e.EnquiryId = string.IsNullOrWhiteSpace(request.EnquiryId) || !Guid.TryParse(request.EnquiryId, out var eid) ? null : eid;
        e.ClassId = string.IsNullOrWhiteSpace(request.ClassId) || !Guid.TryParse(request.ClassId, out var cid) ? null : cid;
        e.BatchId = string.IsNullOrWhiteSpace(request.BatchId) || !Guid.TryParse(request.BatchId, out var bid) ? null : bid;
        return e;
    }

    private static void MapToEntity(UpdateApplicationRequest request, Domain.Entities.Application e)
    {
        MapToEntityCore(request, e);
        e.ClassId = string.IsNullOrWhiteSpace(request.ClassId) || !Guid.TryParse(request.ClassId, out var cid) ? null : cid;
        e.BatchId = string.IsNullOrWhiteSpace(request.BatchId) || !Guid.TryParse(request.BatchId, out var bid) ? null : bid;
        e.Batch = request.Batch;
        e.Section = request.Section;
        e.InterviewDate = request.InterviewDate;
        e.InterviewNotes = request.InterviewNotes;
    }

    private static void MapToEntityCore(CreateApplicationRequest request, Domain.Entities.Application e)
    {
        e.StudentName = request.StudentName;
        e.AcademicYear = request.AcademicYear;
        e.Gender = request.Gender;
        e.PlaceOfBirth = request.PlaceOfBirth;
        e.DateOfBirth = request.DateOfBirth;
        e.Nationality = request.Nationality;
        e.Religion = request.Religion;
        e.PreviousSchool = request.PreviousSchool;
        e.PreviousClass = request.PreviousClass;
        e.EmirateIfInsideUae = request.EmirateIfInsideUae;
        e.ClassApplied = request.ClassApplied;
        e.CountryIfOutsideUae = request.CountryIfOutsideUae;
        e.SyllabusPreviousSchool = request.SyllabusPreviousSchool;
        e.SecondLangPreviousSchool = request.SecondLangPreviousSchool;
        e.DateOfLastAttendance = request.DateOfLastAttendance;
        e.PassportNo = request.PassportNo;
        e.PassportPlaceOfIssue = request.PassportPlaceOfIssue;
        e.PassportDateOfIssue = request.PassportDateOfIssue;
        e.PassportDateOfExpiry = request.PassportDateOfExpiry;
        e.ResidenceVisaNo = request.ResidenceVisaNo;
        e.ResidenceVisaPlaceOfIssue = request.ResidenceVisaPlaceOfIssue;
        e.ResidenceVisaDateOfIssue = request.ResidenceVisaDateOfIssue;
        e.ResidenceVisaDateOfExpiry = request.ResidenceVisaDateOfExpiry;
        e.EmiratesIdNo = request.EmiratesIdNo;
        e.EmiratesIdDateOfExpiry = request.EmiratesIdDateOfExpiry;
        e.AnySpecialNeeds = request.AnySpecialNeeds;
        e.SpecialNeedsDetails = request.SpecialNeedsDetails;
        e.PassportPhotoUrl = request.PassportPhotoUrl;
        e.SisNo = request.SisNo;
        e.RegNo = request.RegNo;
        e.CheckedBy = request.CheckedBy;
        e.OfficeSignature = request.OfficeSignature;
        e.Principal = request.Principal;
        e.ExtraCurricularSportsJson = request.ExtraCurricularSports == null ? null : JsonSerializer.Serialize(request.ExtraCurricularSports);
        e.ExtraCurricularActivitiesJson = request.ExtraCurricularActivities == null ? null : JsonSerializer.Serialize(request.ExtraCurricularActivities);
        e.FatherNameAsInPassport = request.FatherNameAsInPassport;
        e.FatherReligion = request.FatherReligion;
        e.FatherNationality = request.FatherNationality;
        e.FatherQualification = request.FatherQualification;
        e.FatherMobileNumber = request.FatherMobileNumber;
        e.FatherEmailAddress = request.FatherEmailAddress;
        e.FatherOccupation = request.FatherOccupation;
        e.FatherCompanyName = request.FatherCompanyName;
        e.FatherDesignation = request.FatherDesignation;
        e.FatherPoBoxEmirate = request.FatherPoBoxEmirate;
        e.FatherOfficeTelephone = request.FatherOfficeTelephone;
        e.FatherEmiratesIdNumber = request.FatherEmiratesIdNumber;
        e.FatherAddressOfResidence = request.FatherAddressOfResidence;
        e.FatherAddressInHomeCountry = request.FatherAddressInHomeCountry;
        e.MotherNameAsInPassport = request.MotherNameAsInPassport;
        e.MotherReligion = request.MotherReligion;
        e.MotherNationality = request.MotherNationality;
        e.MotherQualification = request.MotherQualification;
        e.MotherMobileNumber = request.MotherMobileNumber;
        e.MotherEmailAddress = request.MotherEmailAddress;
        e.MotherOccupation = request.MotherOccupation;
        e.MotherCompanyName = request.MotherCompanyName;
        e.MotherDesignation = request.MotherDesignation;
        e.MotherPoBoxEmirate = request.MotherPoBoxEmirate;
        e.MotherOfficeTelephone = request.MotherOfficeTelephone;
        e.MotherEmiratesIdNumber = request.MotherEmiratesIdNumber;
        e.MotherAddressOfResidence = request.MotherAddressOfResidence;
        e.MotherAddressInHomeCountry = request.MotherAddressInHomeCountry;
        e.OtherChildrenInSchoolJson = request.OtherChildrenInSchool == null ? null : JsonSerializer.Serialize(request.OtherChildrenInSchool);
        e.DeclarationParentNameAndSignature = request.DeclarationParentNameAndSignature;
        e.DeclarationDate = request.DeclarationDate;
        e.GuardianName = request.FatherNameAsInPassport;
        e.GuardianPhone = request.FatherMobileNumber;
        e.GuardianEmail = request.FatherEmailAddress;
    }

    private static void MapToEntityCore(UpdateApplicationRequest request, Domain.Entities.Application e)
    {
        e.StudentName = request.StudentName;
        e.AcademicYear = request.AcademicYear;
        e.Gender = request.Gender;
        e.PlaceOfBirth = request.PlaceOfBirth;
        e.DateOfBirth = request.DateOfBirth;
        e.Nationality = request.Nationality;
        e.Religion = request.Religion;
        e.PreviousSchool = request.PreviousSchool;
        e.PreviousClass = request.PreviousClass;
        e.EmirateIfInsideUae = request.EmirateIfInsideUae;
        e.ClassApplied = request.ClassApplied;
        e.CountryIfOutsideUae = request.CountryIfOutsideUae;
        e.SyllabusPreviousSchool = request.SyllabusPreviousSchool;
        e.SecondLangPreviousSchool = request.SecondLangPreviousSchool;
        e.DateOfLastAttendance = request.DateOfLastAttendance;
        e.PassportNo = request.PassportNo;
        e.PassportPlaceOfIssue = request.PassportPlaceOfIssue;
        e.PassportDateOfIssue = request.PassportDateOfIssue;
        e.PassportDateOfExpiry = request.PassportDateOfExpiry;
        e.ResidenceVisaNo = request.ResidenceVisaNo;
        e.ResidenceVisaPlaceOfIssue = request.ResidenceVisaPlaceOfIssue;
        e.ResidenceVisaDateOfIssue = request.ResidenceVisaDateOfIssue;
        e.ResidenceVisaDateOfExpiry = request.ResidenceVisaDateOfExpiry;
        e.EmiratesIdNo = request.EmiratesIdNo;
        e.EmiratesIdDateOfExpiry = request.EmiratesIdDateOfExpiry;
        e.AnySpecialNeeds = request.AnySpecialNeeds;
        e.SpecialNeedsDetails = request.SpecialNeedsDetails;
        e.PassportPhotoUrl = request.PassportPhotoUrl;
        e.SisNo = request.SisNo;
        e.RegNo = request.RegNo;
        e.CheckedBy = request.CheckedBy;
        e.OfficeSignature = request.OfficeSignature;
        e.Principal = request.Principal;
        e.ExtraCurricularSportsJson = request.ExtraCurricularSports == null ? null : JsonSerializer.Serialize(request.ExtraCurricularSports);
        e.ExtraCurricularActivitiesJson = request.ExtraCurricularActivities == null ? null : JsonSerializer.Serialize(request.ExtraCurricularActivities);
        e.FatherNameAsInPassport = request.FatherNameAsInPassport;
        e.FatherReligion = request.FatherReligion;
        e.FatherNationality = request.FatherNationality;
        e.FatherQualification = request.FatherQualification;
        e.FatherMobileNumber = request.FatherMobileNumber;
        e.FatherEmailAddress = request.FatherEmailAddress;
        e.FatherOccupation = request.FatherOccupation;
        e.FatherCompanyName = request.FatherCompanyName;
        e.FatherDesignation = request.FatherDesignation;
        e.FatherPoBoxEmirate = request.FatherPoBoxEmirate;
        e.FatherOfficeTelephone = request.FatherOfficeTelephone;
        e.FatherEmiratesIdNumber = request.FatherEmiratesIdNumber;
        e.FatherAddressOfResidence = request.FatherAddressOfResidence;
        e.FatherAddressInHomeCountry = request.FatherAddressInHomeCountry;
        e.MotherNameAsInPassport = request.MotherNameAsInPassport;
        e.MotherReligion = request.MotherReligion;
        e.MotherNationality = request.MotherNationality;
        e.MotherQualification = request.MotherQualification;
        e.MotherMobileNumber = request.MotherMobileNumber;
        e.MotherEmailAddress = request.MotherEmailAddress;
        e.MotherOccupation = request.MotherOccupation;
        e.MotherCompanyName = request.MotherCompanyName;
        e.MotherDesignation = request.MotherDesignation;
        e.MotherPoBoxEmirate = request.MotherPoBoxEmirate;
        e.MotherOfficeTelephone = request.MotherOfficeTelephone;
        e.MotherEmiratesIdNumber = request.MotherEmiratesIdNumber;
        e.MotherAddressOfResidence = request.MotherAddressOfResidence;
        e.MotherAddressInHomeCountry = request.MotherAddressInHomeCountry;
        e.OtherChildrenInSchoolJson = request.OtherChildrenInSchool == null ? null : JsonSerializer.Serialize(request.OtherChildrenInSchool);
        e.DeclarationParentNameAndSignature = request.DeclarationParentNameAndSignature;
        e.DeclarationDate = request.DeclarationDate;
        e.GuardianName = request.FatherNameAsInPassport;
        e.GuardianPhone = request.FatherMobileNumber;
        e.GuardianEmail = request.FatherEmailAddress;
    }

    private static ApplicationDto Map(Domain.Entities.Application e)
    {
        List<string>? sports = null;
        if (!string.IsNullOrWhiteSpace(e.ExtraCurricularSportsJson))
        {
            try { sports = JsonSerializer.Deserialize<List<string>>(e.ExtraCurricularSportsJson, JsonOptions); } catch { }
        }
        List<string>? activities = null;
        if (!string.IsNullOrWhiteSpace(e.ExtraCurricularActivitiesJson))
        {
            try { activities = JsonSerializer.Deserialize<List<string>>(e.ExtraCurricularActivitiesJson, JsonOptions); } catch { }
        }
        List<SiblingInSchoolDto>? siblings = null;
        if (!string.IsNullOrWhiteSpace(e.OtherChildrenInSchoolJson))
        {
            try { siblings = JsonSerializer.Deserialize<List<SiblingInSchoolDto>>(e.OtherChildrenInSchoolJson, JsonOptions); } catch { }
        }
        return new ApplicationDto
        {
            Id = e.Id.ToString(),
            EnquiryId = e.EnquiryId?.ToString(),
            Status = e.Status,
            AdmissionNumber = e.AdmissionNumber,
            ClassId = e.ClassId?.ToString(),
            BatchId = e.BatchId?.ToString(),
            Batch = e.Batch,
            Section = e.Section,
            CreatedAt = e.CreatedAt,
            AcademicYear = e.AcademicYear,
            StudentName = e.StudentName,
            Gender = e.Gender,
            PlaceOfBirth = e.PlaceOfBirth,
            DateOfBirth = e.DateOfBirth,
            Nationality = e.Nationality,
            Religion = e.Religion,
            PreviousSchool = e.PreviousSchool,
            PreviousClass = e.PreviousClass,
            EmirateIfInsideUae = e.EmirateIfInsideUae,
            ClassApplied = e.ClassApplied,
            CountryIfOutsideUae = e.CountryIfOutsideUae,
            SyllabusPreviousSchool = e.SyllabusPreviousSchool,
            SecondLangPreviousSchool = e.SecondLangPreviousSchool,
            DateOfLastAttendance = e.DateOfLastAttendance,
            PassportNo = e.PassportNo,
            PassportPlaceOfIssue = e.PassportPlaceOfIssue,
            PassportDateOfIssue = e.PassportDateOfIssue,
            PassportDateOfExpiry = e.PassportDateOfExpiry,
            ResidenceVisaNo = e.ResidenceVisaNo,
            ResidenceVisaPlaceOfIssue = e.ResidenceVisaPlaceOfIssue,
            ResidenceVisaDateOfIssue = e.ResidenceVisaDateOfIssue,
            ResidenceVisaDateOfExpiry = e.ResidenceVisaDateOfExpiry,
            EmiratesIdNo = e.EmiratesIdNo,
            EmiratesIdDateOfExpiry = e.EmiratesIdDateOfExpiry,
            AnySpecialNeeds = e.AnySpecialNeeds,
            SpecialNeedsDetails = e.SpecialNeedsDetails,
            PassportPhotoUrl = e.PassportPhotoUrl,
            SisNo = e.SisNo,
            RegNo = e.RegNo,
            CheckedBy = e.CheckedBy,
            OfficeSignature = e.OfficeSignature,
            Principal = e.Principal,
            ExtraCurricularSports = sports,
            ExtraCurricularActivities = activities,
            FatherNameAsInPassport = e.FatherNameAsInPassport,
            FatherReligion = e.FatherReligion,
            FatherNationality = e.FatherNationality,
            FatherQualification = e.FatherQualification,
            FatherMobileNumber = e.FatherMobileNumber,
            FatherEmailAddress = e.FatherEmailAddress,
            FatherOccupation = e.FatherOccupation,
            FatherCompanyName = e.FatherCompanyName,
            FatherDesignation = e.FatherDesignation,
            FatherPoBoxEmirate = e.FatherPoBoxEmirate,
            FatherOfficeTelephone = e.FatherOfficeTelephone,
            FatherEmiratesIdNumber = e.FatherEmiratesIdNumber,
            FatherAddressOfResidence = e.FatherAddressOfResidence,
            FatherAddressInHomeCountry = e.FatherAddressInHomeCountry,
            MotherNameAsInPassport = e.MotherNameAsInPassport,
            MotherReligion = e.MotherReligion,
            MotherNationality = e.MotherNationality,
            MotherQualification = e.MotherQualification,
            MotherMobileNumber = e.MotherMobileNumber,
            MotherEmailAddress = e.MotherEmailAddress,
            MotherOccupation = e.MotherOccupation,
            MotherCompanyName = e.MotherCompanyName,
            MotherDesignation = e.MotherDesignation,
            MotherPoBoxEmirate = e.MotherPoBoxEmirate,
            MotherOfficeTelephone = e.MotherOfficeTelephone,
            MotherEmiratesIdNumber = e.MotherEmiratesIdNumber,
            MotherAddressOfResidence = e.MotherAddressOfResidence,
            MotherAddressInHomeCountry = e.MotherAddressInHomeCountry,
            OtherChildrenInSchool = siblings,
            DeclarationParentNameAndSignature = e.DeclarationParentNameAndSignature,
            DeclarationDate = e.DeclarationDate,
            GuardianName = e.GuardianName,
            GuardianPhone = e.GuardianPhone,
            GuardianEmail = e.GuardianEmail,
            InterviewDate = e.InterviewDate,
            InterviewNotes = e.InterviewNotes
        };
    }
}
