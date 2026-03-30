namespace Studyzone.Domain.Entities;

public class Announcement
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string AudienceType { get; set; } = "All"; // All, Class, Individual, Teachers, Parents
    public Guid? TargetId { get; set; }   // ClassId or UserId/StudentId when audience is Class or Individual
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}