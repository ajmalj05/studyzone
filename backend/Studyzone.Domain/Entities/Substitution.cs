namespace Studyzone.Domain.Entities;

public class Substitution
{
    public Guid Id { get; set; }
    public Guid TimetableSlotId { get; set; }
    public DateTime ForDate { get; set; }
    public Guid SubstituteTeacherUserId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
