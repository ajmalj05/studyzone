namespace Studyzone.Application.Notifications;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationDto>> GetForCurrentUserAsync(string userId, int skip, int take, CancellationToken ct = default);
    Task<bool> DismissAsync(string notificationId, string userId, CancellationToken ct = default);
    Task CreateForAdminsAsync(string type, string title, Guid? relatedEntityId, CancellationToken ct = default);
    Task CreateForUserAsync(string userId, string type, string title, Guid? relatedEntityId, CancellationToken ct = default);
}
