using Studyzone.Application.Students;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class BatchService : IBatchService
{
    private readonly IBatchRepository _repo;

    public BatchService(IBatchRepository repo)
    {
        _repo = repo;
    }

    public async Task<BatchDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : Map(e);
    }

    public async Task<IReadOnlyList<BatchDto>> GetByClassIdAsync(string classId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(classId, out var guid)) return Array.Empty<BatchDto>();
        var list = await _repo.GetByClassIdAsync(guid, ct);
        return list.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<BatchDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _repo.GetAllAsync(ct);
        return list.Select(Map).ToList();
    }

    public async Task<BatchDto> CreateAsync(CreateBatchRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(request.ClassId, out var classId))
            throw new ArgumentException("Invalid class id.", nameof(request));
        var entity = new Batch
        {
            Id = Guid.NewGuid(),
            ClassId = classId,
            Name = request.Name,
            Section = request.Section,
            SeatLimit = request.SeatLimit,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _repo.AddAsync(entity, ct);
        return Map(added);
    }

    public async Task<BatchDto> UpdateAsync(string id, CreateBatchRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _repo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Batch not found.");
        entity.Name = request.Name;
        entity.Section = request.Section;
        entity.SeatLimit = request.SeatLimit;
        await _repo.UpdateAsync(entity, ct);
        return Map(entity);
    }

    private static BatchDto Map(Batch e) => new()
    {
        Id = e.Id.ToString(),
        ClassId = e.ClassId.ToString(),
        ClassName = e.Class?.Name ?? "",
        Name = e.Name,
        Section = e.Section,
        SeatLimit = e.SeatLimit
    };
}
