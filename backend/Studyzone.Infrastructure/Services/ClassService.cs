using Studyzone.Application.Students;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class ClassService : IClassService
{
    private readonly IClassRepository _repo;

    public ClassService(IClassRepository repo)
    {
        _repo = repo;
    }

    public async Task<ClassDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : Map(e);
    }

    public async Task<IReadOnlyList<ClassDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _repo.GetAllAsync(ct);
        return list.Select(Map).ToList();
    }

    public async Task<ClassDto> CreateAsync(CreateClassRequest request, CancellationToken ct = default)
    {
        var entity = new Class
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Code = request.Code,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _repo.AddAsync(entity, ct);
        return Map(added);
    }

    public async Task<ClassDto> UpdateAsync(string id, CreateClassRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _repo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Class not found.");
        entity.Name = request.Name;
        entity.Code = request.Code;
        await _repo.UpdateAsync(entity, ct);
        return Map(entity);
    }

    private static ClassDto Map(Class e) => new()
    {
        Id = e.Id.ToString(),
        Name = e.Name,
        Code = e.Code
    };
}
