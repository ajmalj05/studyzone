using System.Text.Json;
using Studyzone.Application.Students;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class StudentService : IStudentService
{
    private readonly IStudentRepository _studentRepo;
    private readonly IClassRepository _classRepo;
    private readonly IBatchRepository _batchRepo;
    private readonly IStudentStatusHistoryRepository _historyRepo;

    public StudentService(IStudentRepository studentRepo, IClassRepository classRepo, IBatchRepository batchRepo, IStudentStatusHistoryRepository historyRepo)
    {
        _studentRepo = studentRepo;
        _classRepo = classRepo;
        _batchRepo = batchRepo;
        _historyRepo = historyRepo;
    }

    public async Task<StudentDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var s = await _studentRepo.GetByIdAsync(guid, ct);
        if (s == null) return null;
        return await MapAsync(s, ct);
    }

    public async Task<(IReadOnlyList<StudentDto> Items, int Total)> GetAllAsync(string? classId, string? batchId, string? status, int skip, int take, CancellationToken ct = default)
    {
        var cid = string.IsNullOrWhiteSpace(classId) || !Guid.TryParse(classId, out var cg) ? (Guid?)null : cg;
        var bid = string.IsNullOrWhiteSpace(batchId) || !Guid.TryParse(batchId, out var bg) ? (Guid?)null : bg;
        var list = await _studentRepo.GetAllAsync(cid, bid, status, skip, take, ct);
        var total = await _studentRepo.CountAsync(cid, bid, status, ct);
        var dtos = new List<StudentDto>();
        foreach (var s in list)
            dtos.Add(await MapAsync(s, ct));
        return (dtos, total);
    }

    public async Task<StudentDto> CreateAsync(CreateStudentRequest request, CancellationToken ct = default)
    {
        var sid = string.IsNullOrWhiteSpace(request.SiblingGroupId) || !Guid.TryParse(request.SiblingGroupId, out var sg) ? (Guid?)null : sg;
        var cid = string.IsNullOrWhiteSpace(request.ClassId) || !Guid.TryParse(request.ClassId, out var cg) ? (Guid?)null : cg;
        var bid = string.IsNullOrWhiteSpace(request.BatchId) || !Guid.TryParse(request.BatchId, out var bg) ? (Guid?)null : bg;
        var entity = new Student
        {
            Id = Guid.NewGuid(),
            AdmissionNumber = request.AdmissionNumber,
            Name = request.Name,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            ClassId = cid,
            BatchId = bid,
            Section = request.Section,
            Status = "Active",
            GuardianName = request.GuardianName,
            GuardianPhone = request.GuardianPhone,
            GuardianEmail = request.GuardianEmail,
            Address = request.Address,
            SiblingGroupId = sid,
            CustomFieldsJson = request.CustomFields == null ? null : JsonSerializer.Serialize(request.CustomFields),
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _studentRepo.AddAsync(entity, ct);
        return await MapAsync(added, ct);
    }

    public async Task<StudentDto> UpdateAsync(string id, UpdateStudentRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _studentRepo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Student not found.");
        entity.Name = request.Name;
        entity.DateOfBirth = request.DateOfBirth;
        entity.Gender = request.Gender;
        entity.ClassId = string.IsNullOrWhiteSpace(request.ClassId) || !Guid.TryParse(request.ClassId, out var cg) ? null : cg;
        entity.BatchId = string.IsNullOrWhiteSpace(request.BatchId) || !Guid.TryParse(request.BatchId, out var bg) ? null : bg;
        entity.Section = request.Section;
        entity.GuardianName = request.GuardianName;
        entity.GuardianPhone = request.GuardianPhone;
        entity.GuardianEmail = request.GuardianEmail;
        entity.Address = request.Address;
        entity.SiblingGroupId = string.IsNullOrWhiteSpace(request.SiblingGroupId) || !Guid.TryParse(request.SiblingGroupId, out var sg) ? null : sg;
        entity.CustomFieldsJson = request.CustomFields == null ? null : JsonSerializer.Serialize(request.CustomFields);
        await _studentRepo.UpdateAsync(entity, ct);
        return await MapAsync(entity, ct);
    }

    public async Task SetStatusAsync(string id, string status, string? notes, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _studentRepo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Student not found.");
        entity.Status = status;
        if (status == "Withdrawn" || status == "Transferred" || status == "Alumni")
            entity.LeftAt = DateTime.UtcNow;
        await _studentRepo.UpdateAsync(entity, ct);
        await _historyRepo.AddAsync(new StudentStatusHistory
        {
            Id = Guid.NewGuid(),
            StudentId = guid,
            Status = status,
            EffectiveDate = DateTime.UtcNow,
            Notes = notes,
            CreatedAt = DateTime.UtcNow
        }, ct);
    }

    public async Task BulkPromoteAsync(BulkPromoteRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.TargetClassId, out var targetClassId))
            throw new ArgumentException("Invalid target class.", nameof(request));
        Guid? targetBatchId = string.IsNullOrWhiteSpace(request.TargetBatchId) || !Guid.TryParse(request.TargetBatchId, out var tb) ? null : tb;
        foreach (var sid in request.StudentIds)
        {
            if (string.IsNullOrWhiteSpace(sid) || !Guid.TryParse(sid, out var guid)) continue;
            var s = await _studentRepo.GetByIdAsync(guid, ct);
            if (s == null) continue;
            s.ClassId = targetClassId;
            s.BatchId = targetBatchId;
            s.Section = request.TargetSection;
            await _studentRepo.UpdateAsync(s, ct);
        }
    }

    private async Task<StudentDto> MapAsync(Student s, CancellationToken ct)
    {
        string? className = null, batchName = null;
        if (s.ClassId.HasValue)
        {
            var c = await _classRepo.GetByIdAsync(s.ClassId.Value, ct);
            className = c?.Name;
        }
        if (s.BatchId.HasValue)
        {
            var b = await _batchRepo.GetByIdAsync(s.BatchId.Value, ct);
            batchName = b?.Name;
        }
        Dictionary<string, string>? custom = null;
        if (!string.IsNullOrWhiteSpace(s.CustomFieldsJson))
        {
            try { custom = JsonSerializer.Deserialize<Dictionary<string, string>>(s.CustomFieldsJson); } catch { /* ignore */ }
        }
        return new StudentDto
        {
            Id = s.Id.ToString(),
            AdmissionNumber = s.AdmissionNumber,
            UserId = s.UserId?.ToString(),
            Name = s.Name,
            DateOfBirth = s.DateOfBirth,
            Gender = s.Gender,
            ClassId = s.ClassId?.ToString(),
            ClassName = className,
            BatchId = s.BatchId?.ToString(),
            BatchName = batchName,
            Section = s.Section,
            Status = s.Status,
            GuardianName = s.GuardianName,
            GuardianPhone = s.GuardianPhone,
            GuardianEmail = s.GuardianEmail,
            Address = s.Address,
            JoinedAt = s.JoinedAt,
            LeftAt = s.LeftAt,
            SiblingGroupId = s.SiblingGroupId?.ToString(),
            CustomFields = custom,
            CreatedAt = s.CreatedAt
        };
    }
}
