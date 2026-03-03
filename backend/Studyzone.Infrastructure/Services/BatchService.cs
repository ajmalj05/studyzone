using Studyzone.Application.Students;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class BatchService : IBatchService
{
    private readonly IBatchRepository _repo;
    private readonly IUserRepository _userRepo;
    private readonly IAcademicYearRepository _academicYearRepo;

    public BatchService(IBatchRepository repo, IUserRepository userRepo, IAcademicYearRepository academicYearRepo)
    {
        _repo = repo;
        _userRepo = userRepo;
        _academicYearRepo = academicYearRepo;
    }

    public async Task<BatchDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : await MapAsync(e, ct);
    }

    public async Task<BatchDto?> GetBatchByClassTeacherAsync(string userId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(userId, out var userGuid)) return null;
        var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
        if (currentYear == null) return null;
        var e = await _repo.GetByClassTeacherUserIdAndAcademicYearAsync(userGuid, currentYear.Id, ct);
        return e == null ? null : await MapAsync(e, ct);
    }

    public async Task<IReadOnlyList<BatchDto>> GetByClassIdAsync(string classId, string? academicYearId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(classId, out var guid)) return Array.Empty<BatchDto>();
        var yearId = await ResolveAcademicYearIdAsync(academicYearId, ct);
        if (yearId == null) return Array.Empty<BatchDto>();
        var list = await _repo.GetByClassIdAndAcademicYearAsync(guid, yearId.Value, ct);
        return list.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<BatchDto>> GetAllAsync(string? academicYearId, CancellationToken ct = default)
    {
        var yearId = await ResolveAcademicYearIdAsync(academicYearId, ct);
        if (yearId == null)
        {
            var list = await _repo.GetAllAsync(ct);
            return list.Select(Map).ToList();
        }
        var listByYear = await _repo.GetByAcademicYearAsync(yearId.Value, ct);
        return listByYear.Select(Map).ToList();
    }

    public async Task<BatchDto> CreateAsync(CreateBatchRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.ClassId, out var classId))
            throw new ArgumentException("Invalid class id.", nameof(request));
        var academicYearId = await ResolveAcademicYearIdAsync(
            string.IsNullOrWhiteSpace(request.AcademicYearId) ? null : request.AcademicYearId, ct)
            ?? throw new InvalidOperationException("Academic year is required. Set current academic year in settings.");
        var classTeacherId = string.IsNullOrWhiteSpace(request.ClassTeacherUserId) || !Guid.TryParse(request.ClassTeacherUserId, out var ctGuid)
            ? (Guid?)null
            : ctGuid;
        var entity = new Batch
        {
            Id = Guid.NewGuid(),
            ClassId = classId,
            AcademicYearId = academicYearId,
            Name = request.Name,
            Section = request.Section,
            SeatLimit = request.SeatLimit,
            ClassTeacherUserId = classTeacherId,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _repo.AddAsync(entity, ct);
        return await MapAsync(added, ct);
    }

    public async Task<BatchDto> UpdateAsync(string id, CreateBatchRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _repo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Batch not found.");
        entity.Name = request.Name;
        entity.Section = request.Section;
        entity.SeatLimit = request.SeatLimit;
        entity.ClassTeacherUserId = string.IsNullOrWhiteSpace(request.ClassTeacherUserId) || !Guid.TryParse(request.ClassTeacherUserId, out var ctGuid)
            ? null
            : ctGuid;
        await _repo.UpdateAsync(entity, ct);
        return await MapAsync(entity, ct);
    }

    private async Task<Guid?> ResolveAcademicYearIdAsync(string? academicYearId, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(academicYearId) && Guid.TryParse(academicYearId, out var id))
            return id;
        var current = await _academicYearRepo.GetCurrentAsync(ct);
        return current?.Id;
    }

    private static BatchDto Map(Batch e) => new()
    {
        Id = e.Id.ToString(),
        ClassId = e.ClassId.ToString(),
        ClassName = e.Class?.Name ?? "",
        AcademicYearId = e.AcademicYearId.ToString(),
        AcademicYearName = e.AcademicYear?.Name,
        Name = e.Name,
        Section = e.Section,
        SeatLimit = e.SeatLimit,
        ClassTeacherUserId = e.ClassTeacherUserId?.ToString(),
        ClassTeacherName = null
    };

    private async Task<BatchDto> MapAsync(Batch e, CancellationToken ct)
    {
        var dto = Map(e);
        if (e.ClassTeacherUserId.HasValue)
        {
            var user = await _userRepo.GetByIdAsync(e.ClassTeacherUserId.Value, ct);
            if (user != null)
                dto.ClassTeacherName = user.Name;
        }
        return dto;
    }
}
