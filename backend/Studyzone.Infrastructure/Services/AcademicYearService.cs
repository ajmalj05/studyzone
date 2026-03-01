using Studyzone.Application.Administration;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class AcademicYearService : IAcademicYearService
{
    private readonly IAcademicYearRepository _repo;

    public AcademicYearService(IAcademicYearRepository repo)
    {
        _repo = repo;
    }

    public async Task<AcademicYearDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : Map(e);
    }

    public async Task<AcademicYearDto?> GetCurrentAsync(CancellationToken ct = default)
    {
        var e = await _repo.GetCurrentAsync(ct);
        return e == null ? null : Map(e);
    }

    public async Task<IReadOnlyList<AcademicYearDto>> GetAllAsync(bool includeArchived, CancellationToken ct = default)
    {
        var list = await _repo.GetAllAsync(includeArchived, ct);
        return list.Select(Map).ToList();
    }

    public async Task<AcademicYearDto> CreateAsync(CreateAcademicYearRequest request, CancellationToken ct = default)
    {
        var entity = new AcademicYear
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            StartDate = ToUtc(request.StartDate),
            EndDate = ToUtc(request.EndDate),
            IsCurrent = false,
            IsArchived = false,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _repo.AddAsync(entity, ct);
        return Map(added);
    }

    public async Task<AcademicYearDto> UpdateAsync(string id, UpdateAcademicYearRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _repo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Academic year not found.");
        entity.Name = request.Name;
        entity.StartDate = ToUtc(request.StartDate);
        entity.EndDate = ToUtc(request.EndDate);
        entity.IsArchived = request.IsArchived;
        await _repo.UpdateAsync(entity, ct);
        return Map(entity);
    }

    public async Task SetCurrentAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        await _repo.SetCurrentAsync(guid, ct);
    }

    private static DateTime ToUtc(DateTime value)
    {
        return value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value.Date, DateTimeKind.Utc);
    }

    private static AcademicYearDto Map(AcademicYear e) => new()
    {
        Id = e.Id.ToString(),
        Name = e.Name,
        StartDate = e.StartDate,
        EndDate = e.EndDate,
        IsCurrent = e.IsCurrent,
        IsArchived = e.IsArchived
    };
}
