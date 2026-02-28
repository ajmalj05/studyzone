using Studyzone.Application.Administration;
using Studyzone.Application.Admission;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class AdmissionApplicationService : IApplicationService
{
    private readonly IApplicationRepository _appRepo;
    private readonly IAdmissionApprovalRepository _approvalRepo;
    private readonly IAdmissionNumberGenerator _numberGen;
    private readonly IAcademicYearRepository _yearRepo;
    private readonly IAuditLogService _audit;

    public AdmissionApplicationService(
        IApplicationRepository appRepo,
        IAdmissionApprovalRepository approvalRepo,
        IAdmissionNumberGenerator numberGen,
        IAcademicYearRepository yearRepo,
        IAuditLogService audit)
    {
        _appRepo = appRepo;
        _approvalRepo = approvalRepo;
        _numberGen = numberGen;
        _yearRepo = yearRepo;
        _audit = audit;
    }

    public async Task<ApplicationDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _appRepo.GetByIdAsync(guid, ct);
        return e == null ? null : Map(e);
    }

    public async Task<(IReadOnlyList<ApplicationDto> Items, int Total)> GetAllAsync(string? statusFilter, int skip, int take, CancellationToken ct = default)
    {
        var list = await _appRepo.GetAllAsync(statusFilter, skip, take, ct);
        var total = await _appRepo.CountAsync(statusFilter, ct);
        return (list.Select(Map).ToList(), total);
    }

    public async Task<ApplicationDto> CreateAsync(CreateApplicationRequest request, CancellationToken ct = default)
    {
        var entity = new Domain.Entities.Application
        {
            Id = Guid.NewGuid(),
            EnquiryId = string.IsNullOrWhiteSpace(request.EnquiryId) || !Guid.TryParse(request.EnquiryId, out var eid) ? null : eid,
            StudentName = request.StudentName,
            DateOfBirth = request.DateOfBirth,
            PreviousSchool = request.PreviousSchool,
            GuardianName = request.GuardianName,
            GuardianPhone = request.GuardianPhone,
            GuardianEmail = request.GuardianEmail,
            SubjectsRequired = request.SubjectsRequired,
            ClassApplied = request.ClassApplied,
            ClassId = string.IsNullOrWhiteSpace(request.ClassId) || !Guid.TryParse(request.ClassId, out var cid) ? null : cid,
            BatchId = string.IsNullOrWhiteSpace(request.BatchId) || !Guid.TryParse(request.BatchId, out var bid) ? null : bid,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };
        var added = await _appRepo.AddAsync(entity, ct);
        return Map(added);
    }

    public async Task<ApplicationDto> UpdateAsync(string id, UpdateApplicationRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _appRepo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Application not found.");
        entity.StudentName = request.StudentName;
        entity.DateOfBirth = request.DateOfBirth;
        entity.PreviousSchool = request.PreviousSchool;
        entity.GuardianName = request.GuardianName;
        entity.GuardianPhone = request.GuardianPhone;
        entity.GuardianEmail = request.GuardianEmail;
        entity.SubjectsRequired = request.SubjectsRequired;
        entity.ClassApplied = request.ClassApplied;
        entity.ClassId = string.IsNullOrWhiteSpace(request.ClassId) || !Guid.TryParse(request.ClassId, out var cid) ? null : cid;
        entity.BatchId = string.IsNullOrWhiteSpace(request.BatchId) || !Guid.TryParse(request.BatchId, out var bid) ? null : bid;
        entity.InterviewDate = request.InterviewDate;
        entity.InterviewNotes = request.InterviewNotes;
        entity.Batch = request.Batch;
        entity.Section = request.Section;
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

    private static ApplicationDto Map(Domain.Entities.Application e) => new()
    {
        Id = e.Id.ToString(),
        EnquiryId = e.EnquiryId?.ToString(),
        StudentName = e.StudentName,
        DateOfBirth = e.DateOfBirth,
        PreviousSchool = e.PreviousSchool,
        GuardianName = e.GuardianName,
        GuardianPhone = e.GuardianPhone,
        GuardianEmail = e.GuardianEmail,
        SubjectsRequired = e.SubjectsRequired,
        ClassApplied = e.ClassApplied,
        Status = e.Status,
        InterviewDate = e.InterviewDate,
        InterviewNotes = e.InterviewNotes,
        AdmissionNumber = e.AdmissionNumber,
        ClassId = e.ClassId?.ToString(),
        Batch = e.Batch,
        BatchId = e.BatchId?.ToString(),
        Section = e.Section,
        CreatedAt = e.CreatedAt
    };
}
