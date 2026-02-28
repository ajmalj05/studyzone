using Studyzone.Application.Common.Interfaces;
using Studyzone.Application.Notifications;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;
    private readonly IUserRepository _userRepo;

    public NotificationService(INotificationRepository repo, IUserRepository userRepo)
    {
        _repo = repo;
        _userRepo = userRepo;
    }

    public async Task<IReadOnlyList<NotificationDto>> GetForCurrentUserAsync(string userId, int skip, int take, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var userGuid))
            return Array.Empty<NotificationDto>();
        var list = await _repo.GetByUserIdAsync(userGuid, skip, take, ct);
        return list.Select(MapToDto).ToList();
    }

    public async Task<bool> DismissAsync(string notificationId, string userId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(notificationId) || !Guid.TryParse(notificationId, out var id))
            return false;
        if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var userGuid))
            return false;
        var notification = await _repo.GetByIdAsync(id, ct);
        if (notification == null || notification.UserId != userGuid)
            return false;
        await _repo.DeleteAsync(id, ct);
        return true;
    }

    public async Task CreateForAdminsAsync(string type, string title, Guid? relatedEntityId, CancellationToken ct = default)
    {
        var admins = await _userRepo.GetAllAsync("admin", ct);
        foreach (var admin in admins)
        {
            var entity = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = admin.Id,
                Type = type,
                Title = title,
                RelatedEntityId = relatedEntityId,
                CreatedAt = DateTime.UtcNow
            };
            await _repo.AddAsync(entity, ct);
        }
    }

    private static NotificationDto MapToDto(Notification e)
    {
        return new NotificationDto
        {
            Id = e.Id.ToString(),
            UserId = e.UserId.ToString(),
            Type = e.Type,
            Title = e.Title,
            CreatedAt = e.CreatedAt,
            RelatedEntityId = e.RelatedEntityId?.ToString()
        };
    }
}
