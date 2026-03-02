using System.Text.Json;
using Studyzone.Application.Students;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class StudentService : IStudentService
{
    private readonly IStudentRepository _studentRepo;
    private readonly IStudentEnrollmentRepository _enrollmentRepo;
    private readonly IAcademicYearRepository _academicYearRepo;
    private readonly IClassRepository _classRepo;
    private readonly IBatchRepository _batchRepo;
    private readonly IStudentStatusHistoryRepository _historyRepo;
    private readonly IAdmissionNumberGenerator _admissionNumberGenerator;

    public StudentService(
        IStudentRepository studentRepo,
        IStudentEnrollmentRepository enrollmentRepo,
        IAcademicYearRepository academicYearRepo,
        IClassRepository classRepo,
        IBatchRepository batchRepo,
        IStudentStatusHistoryRepository historyRepo,
        IAdmissionNumberGenerator admissionNumberGenerator)
    {
        _studentRepo = studentRepo;
        _enrollmentRepo = enrollmentRepo;
        _academicYearRepo = academicYearRepo;
        _classRepo = classRepo;
        _batchRepo = batchRepo;
        _historyRepo = historyRepo;
        _admissionNumberGenerator = admissionNumberGenerator;
    }

    public async Task<StudentDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var s = await _studentRepo.GetByIdAsync(guid, ct);
        if (s == null) return null;
        var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
        StudentEnrollment? enr = null;
        if (currentYear != null)
            enr = await _enrollmentRepo.GetByStudentAndAcademicYearAsync(guid, currentYear.Id, ct);
        return await MapAsync(s, enr, ct);
    }

    public async Task<(IReadOnlyList<StudentDto> Items, int Total)> GetAllAsync(string? classId, string? batchId, string? status, string? academicYearId, int skip, int take, CancellationToken ct = default)
    {
        Guid? yearGuid = null;
        if (!string.IsNullOrWhiteSpace(academicYearId) && Guid.TryParse(academicYearId, out var yg))
            yearGuid = yg;
        if (!yearGuid.HasValue)
        {
            var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
            yearGuid = currentYear?.Id;
        }
        if (!yearGuid.HasValue)
            return (Array.Empty<StudentDto>(), 0);

        var cid = string.IsNullOrWhiteSpace(classId) || !Guid.TryParse(classId, out var cg) ? (Guid?)null : cg;
        var bid = string.IsNullOrWhiteSpace(batchId) || !Guid.TryParse(batchId, out var bg) ? (Guid?)null : bg;
        var list = await _enrollmentRepo.GetByAcademicYearAsync(yearGuid.Value, cid, bid, status, skip, take, ct);
        var total = await _enrollmentRepo.CountByAcademicYearAsync(yearGuid.Value, cid, bid, status, ct);
        var dtos = new List<StudentDto>();
        foreach (var enr in list)
        {
            if (enr.Student != null)
                dtos.Add(await MapAsync(enr.Student, enr, ct));
        }
        return (dtos, total);
    }

    public async Task<StudentDto> CreateAsync(CreateStudentRequest request, CancellationToken ct = default)
    {
        var currentYear = await _academicYearRepo.GetCurrentAsync(ct) ?? throw new InvalidOperationException("No current academic year set.");
        if (!string.IsNullOrWhiteSpace(request.AcademicYearId) && Guid.TryParse(request.AcademicYearId, out var reqYearId))
        {
            var reqYear = await _academicYearRepo.GetByIdAsync(reqYearId, ct);
            if (reqYear != null) currentYear = reqYear;
        }

        var sid = string.IsNullOrWhiteSpace(request.SiblingGroupId) || !Guid.TryParse(request.SiblingGroupId, out var sg) ? (Guid?)null : sg;
        var student = new Student
        {
            Id = Guid.NewGuid(),
            AdmissionNumber = request.AdmissionNumber,
            Name = request.Name,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            GuardianName = request.GuardianName,
            GuardianPhone = request.GuardianPhone,
            GuardianEmail = request.GuardianEmail,
            Address = request.Address,
            SiblingGroupId = sid,
            CustomFieldsJson = request.CustomFields == null ? null : JsonSerializer.Serialize(request.CustomFields),
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        var addedStudent = await _studentRepo.AddAsync(student, ct);

        var cid = string.IsNullOrWhiteSpace(request.ClassId) || !Guid.TryParse(request.ClassId, out var cg) ? (Guid?)null : cg;
        var bid = string.IsNullOrWhiteSpace(request.BatchId) || !Guid.TryParse(request.BatchId, out var bg) ? (Guid?)null : bg;
        var admissionNumber = request.AdmissionNumber;
        if (string.IsNullOrWhiteSpace(admissionNumber) && cid.HasValue)
        {
            var cls = await _classRepo.GetByIdAsync(cid.Value, ct);
            admissionNumber = cls != null
                ? await _admissionNumberGenerator.GenerateNextAsync(currentYear.Name, cls.Code, ct)
                : $"STZ-{currentYear.Name}-{Guid.NewGuid():N}"[..Math.Min(50, 15 + currentYear.Name.Length + 36)];
        }
        if (string.IsNullOrWhiteSpace(admissionNumber))
            admissionNumber = $"STZ-{currentYear.Name}-{addedStudent.Id:N}"[..Math.Min(60, 15 + currentYear.Name.Length + 32)];

        var enrollment = new StudentEnrollment
        {
            StudentId = addedStudent.Id,
            AcademicYearId = currentYear.Id,
            ClassId = cid,
            BatchId = bid,
            Section = request.Section,
            Status = "Active",
            AdmissionNumber = admissionNumber,
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        await _enrollmentRepo.AddAsync(enrollment, ct);

        return await MapAsync(addedStudent, enrollment, ct);
    }

    public async Task<StudentDto> UpdateAsync(string id, UpdateStudentRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _studentRepo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Student not found.");
        entity.Name = request.Name;
        entity.DateOfBirth = request.DateOfBirth;
        entity.Gender = request.Gender;
        entity.GuardianName = request.GuardianName;
        entity.GuardianPhone = request.GuardianPhone;
        entity.GuardianEmail = request.GuardianEmail;
        entity.Address = request.Address;
        entity.SiblingGroupId = string.IsNullOrWhiteSpace(request.SiblingGroupId) || !Guid.TryParse(request.SiblingGroupId, out var sg) ? null : sg;
        entity.CustomFieldsJson = request.CustomFields == null ? null : JsonSerializer.Serialize(request.CustomFields);
        await _studentRepo.UpdateAsync(entity, ct);

        Guid? yearId = null;
        if (!string.IsNullOrWhiteSpace(request.AcademicYearId) && Guid.TryParse(request.AcademicYearId, out var yid))
            yearId = yid;
        if (!yearId.HasValue)
        {
            var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
            yearId = currentYear?.Id;
        }
        if (yearId.HasValue)
        {
            var enr = await _enrollmentRepo.GetByStudentAndAcademicYearAsync(guid, yearId.Value, ct);
            if (enr != null)
            {
                enr.ClassId = string.IsNullOrWhiteSpace(request.ClassId) || !Guid.TryParse(request.ClassId, out var cg) ? null : cg;
                enr.BatchId = string.IsNullOrWhiteSpace(request.BatchId) || !Guid.TryParse(request.BatchId, out var bg) ? null : bg;
                enr.Section = request.Section;
                await _enrollmentRepo.UpdateAsync(enr, ct);
            }
        }

        var enrForDto = yearId.HasValue ? await _enrollmentRepo.GetByStudentAndAcademicYearAsync(guid, yearId.Value, ct) : null;
        return await MapAsync(entity, enrForDto, ct);
    }

    public async Task SetStatusAsync(string id, string status, string? notes, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _studentRepo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Student not found.");
        var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
        if (currentYear != null)
        {
            var enr = await _enrollmentRepo.GetByStudentAndAcademicYearAsync(guid, currentYear.Id, ct);
            if (enr != null)
            {
                enr.Status = status;
                if (status == "Withdrawn" || status == "Transferred" || status == "Alumni")
                    enr.LeftAt = DateTime.UtcNow;
                await _enrollmentRepo.UpdateAsync(enr, ct);
            }
        }
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

        var targetYear = await _academicYearRepo.GetCurrentAsync(ct);
        if (!string.IsNullOrWhiteSpace(request.TargetAcademicYearId) && Guid.TryParse(request.TargetAcademicYearId, out var tyid))
        {
            var y = await _academicYearRepo.GetByIdAsync(tyid, ct);
            if (y != null) targetYear = y;
        }
        if (targetYear == null)
            throw new InvalidOperationException("Target academic year not set.");

        var targetClass = await _classRepo.GetByIdAsync(targetClassId, ct);
        var classCode = targetClass?.Code ?? "X";

        foreach (var sid in request.StudentIds)
        {
            if (string.IsNullOrWhiteSpace(sid) || !Guid.TryParse(sid, out var guid)) continue;
            var s = await _studentRepo.GetByIdAsync(guid, ct);
            if (s == null) continue;
            if (await _enrollmentRepo.ExistsAsync(guid, targetYear.Id, ct))
                continue;
            var admissionNumber = await _admissionNumberGenerator.GenerateNextAsync(targetYear.Name, classCode, ct);
            var enrollment = new StudentEnrollment
            {
                StudentId = guid,
                AcademicYearId = targetYear.Id,
                ClassId = targetClassId,
                BatchId = targetBatchId,
                Section = request.TargetSection,
                Status = "Active",
                AdmissionNumber = admissionNumber,
                JoinedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            await _enrollmentRepo.AddAsync(enrollment, ct);
        }
    }

    private async Task<StudentDto> MapAsync(Student s, StudentEnrollment? enr, CancellationToken ct)
    {
        string? className = null, batchName = null, academicYearName = null;
        if (enr != null)
        {
            if (enr.ClassId.HasValue)
            {
                var c = await _classRepo.GetByIdAsync(enr.ClassId.Value, ct);
                className = c?.Name;
            }
            if (enr.BatchId.HasValue)
            {
                var b = await _batchRepo.GetByIdAsync(enr.BatchId.Value, ct);
                batchName = b?.Name;
            }
            var ay = await _academicYearRepo.GetByIdAsync(enr.AcademicYearId, ct);
            academicYearName = ay?.Name;
        }
        Dictionary<string, string>? custom = null;
        if (!string.IsNullOrWhiteSpace(s.CustomFieldsJson))
        {
            try { custom = JsonSerializer.Deserialize<Dictionary<string, string>>(s.CustomFieldsJson); } catch { /* ignore */ }
        }
        return new StudentDto
        {
            Id = s.Id.ToString(),
            AdmissionNumber = enr?.AdmissionNumber ?? s.AdmissionNumber,
            UserId = s.UserId?.ToString(),
            Name = s.Name,
            DateOfBirth = s.DateOfBirth,
            Gender = s.Gender,
            ClassId = enr?.ClassId?.ToString(),
            ClassName = className,
            BatchId = enr?.BatchId?.ToString(),
            BatchName = batchName,
            Section = enr?.Section,
            Status = enr?.Status ?? "Active",
            GuardianName = s.GuardianName,
            GuardianPhone = s.GuardianPhone,
            GuardianEmail = s.GuardianEmail,
            Address = s.Address,
            JoinedAt = enr?.JoinedAt ?? s.JoinedAt,
            LeftAt = enr?.LeftAt ?? s.LeftAt,
            SiblingGroupId = s.SiblingGroupId?.ToString(),
            CustomFields = custom,
            CreatedAt = s.CreatedAt,
            AcademicYearId = enr?.AcademicYearId.ToString(),
            AcademicYearName = academicYearName
        };
    }
}
