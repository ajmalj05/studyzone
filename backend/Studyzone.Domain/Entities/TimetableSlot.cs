namespace Studyzone.Domain.Entities;

public class TimetableSlot
{
    public Guid Id { get; set; }
    public Guid BatchId { get; set; }
    public int DayOfWeek { get; set; }
    public int PeriodOrder { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? Room { get; set; }
    public Guid? TeacherUserId { get; set; }
    public string? TeacherName { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
}
