using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Subjects;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class SubjectService : ISubjectService
{
    private readonly ISubjectRepository _repo;
    private readonly IClassRepository _classRepo;

    public SubjectService(ISubjectRepository repo, IClassRepository classRepo)
    {
        _repo = repo;
        _classRepo = classRepo;
    }

    public async Task<IReadOnlyList<SubjectDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _repo.GetAllAsync(ct);
        return list.Select(Map).ToList();
    }

    public async Task<SubjectDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid)) return null;
        var e = await _repo.GetByIdAsync(guid, ct);
        return e == null ? null : Map(e);
    }

    public async Task<IReadOnlyList<SubjectDto>> GetByClassIdAsync(string classId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(classId, out var guid)) return Array.Empty<SubjectDto>();
        var list = await _repo.GetByClassIdAsync(guid, ct);
        return list.Select(Map).ToList();
    }

    public async Task<SubjectDto> CreateAsync(CreateSubjectRequest request, CancellationToken ct = default)
    {
        var entity = new Subject
        {
            Id = Guid.NewGuid(),
            Name = request.Name ?? string.Empty,
            Code = request.Code,
            CreatedAt = DateTime.UtcNow
        };
        var added = await _repo.AddAsync(entity, ct);
        return Map(added);
    }

    public async Task<SubjectDto> UpdateAsync(string id, CreateSubjectRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        var entity = await _repo.GetByIdAsync(guid, ct) ?? throw new InvalidOperationException("Subject not found.");
        entity.Name = request.Name ?? string.Empty;
        entity.Code = request.Code;
        await _repo.UpdateAsync(entity, ct);
        return Map(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            throw new ArgumentException("Invalid id.", nameof(id));
        await _repo.DeleteAsync(guid, ct);
    }

    public async Task SetSubjectsForClassAsync(string classId, SetSubjectsForClassRequest request, CancellationToken ct = default)
    {
        if (!Guid.TryParse(classId, out var classGuid))
            throw new ArgumentException("Invalid class id.", nameof(classId));
        var classExists = await _classRepo.GetByIdAsync(classGuid, ct);
        if (classExists == null)
            throw new InvalidOperationException("Class not found.");
        var subjectIds = new List<Guid>();
        foreach (var sid in request.SubjectIds ?? Array.Empty<string>())
        {
            if (Guid.TryParse(sid, out var g))
                subjectIds.Add(g);
        }
        await _repo.SetSubjectsForClassAsync(classGuid, subjectIds, ct);
    }

    private static SubjectDto Map(Subject e) => new()
    {
        Id = e.Id.ToString(),
        Name = e.Name,
        Code = e.Code,
        CreatedAt = e.CreatedAt
    };
}
