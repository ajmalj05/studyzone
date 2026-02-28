namespace Studyzone.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty; // e.g. PortalRequest, FeePayment
    public string Title { get; set; } = string.Empty;
    public Guid? RelatedEntityId { get; set; }
    public DateTime CreatedAt { get; set; }
}
