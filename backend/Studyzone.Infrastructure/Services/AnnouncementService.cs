using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Communication;

namespace Studyzone.Infrastructure.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly IAnnouncementRepository _repo;
    private readonly IClassRepository _classRepo;
    private readonly IUserRepository _userRepo;

    public AnnouncementService(IAnnouncementRepository repo, IClassRepository classRepo, IUserRepository userRepo)
    {
        _repo = repo;
        _classRepo = classRepo;
        _userRepo = userRepo;
    }

    public async Task<AnnouncementDto> CreateAsync(CreateAnnouncementRequest request, string createdByUserId, CancellationToken ct = default)
    {
        Guid? targetId = null;
        if (!string.IsNullOrWhiteSpace(request.TargetId) && Guid.TryParse(request.TargetId, out var tid))
            targetId = tid;
        if (!Guid.TryParse(createdByUserId, out var createdBy))
            throw new ArgumentException("Invalid createdByUserId");
        var entity = new Domain.Entities.Announcement
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Body = request.Body,
            AudienceType = request.AudienceType ?? "All",
            TargetId = targetId,
            CreatedByUserId = createdBy,
            CreatedAt = DateTime.UtcNow
        };
        entity = await _repo.AddAsync(entity, ct);
        return await MapToDtoAsync(entity, ct);
    }

    public async Task<IReadOnlyList<AnnouncementDto>> GetAllAsync(int skip, int take, CancellationToken ct = default)
    {
        var list = await _repo.GetAllAsync(skip, take, ct);
        var dtos = new List<AnnouncementDto>();
        foreach (var e in list)
            dtos.Add(await MapToDtoAsync(e, ct));
        return dtos;
    }

    public async Task<IReadOnlyList<AnnouncementDto>> GetNoticeBoardAsync(Guid? classId, Guid? userId, Guid? studentId, int take = 50, CancellationToken ct = default)
    {
        var list = await _repo.GetForNoticeBoardAsync(classId, userId, studentId, take, ct);
        var dtos = new List<AnnouncementDto>();
        foreach (var e in list)
            dtos.Add(await MapToDtoAsync(e, ct));
        return dtos;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct = default)
    {
        if (!Guid.TryParse(id, out var guid))
            return false;
        await _repo.DeleteAsync(guid, ct);
        return true;
    }

    private async Task<AnnouncementDto> MapToDtoAsync(Domain.Entities.Announcement e, CancellationToken ct)
    {
        string? targetName = null;
        if (e.TargetId.HasValue)
        {
            var c = await _classRepo.GetByIdAsync(e.TargetId.Value, ct);
            if (c != null) targetName = c.Name;
            else
            {
                var u = await _userRepo.GetByIdAsync(e.TargetId.Value, ct);
                if (u != null) targetName = u.Name;
            }
        }
        return new AnnouncementDto
        {
            Id = e.Id.ToString(),
            Title = e.Title,
            Body = e.Body,
            AudienceType = e.AudienceType,
            TargetId = e.TargetId?.ToString(),
            TargetName = targetName,
            CreatedByUserId = e.CreatedByUserId.ToString(),
            CreatedAt = e.CreatedAt
        };
    }
}
