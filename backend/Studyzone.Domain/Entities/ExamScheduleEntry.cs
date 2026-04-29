namespace Studyzone.Domain.Entities;

public class ExamScheduleEntry
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public Guid? ClassId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Venue { get; set; }
    public decimal? MaxMarks { get; set; }
    public DateTime CreatedAt { get; set; }
}
