namespace Studyzone.Application.Exams;

public class ExamScheduleEntryDto
{
    public string Id { get; set; } = string.Empty;
    public string ExamId { get; set; } = string.Empty;
    public string? ExamName { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string? ClassId { get; set; }
    public string? ClassName { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Venue { get; set; }
    public decimal? MaxMarks { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateExamScheduleEntryRequest
{
    public string ExamId { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string? ClassId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Venue { get; set; }
    public decimal? MaxMarks { get; set; }
}

public class UpdateExamScheduleEntryRequest
{
    public string SubjectName { get; set; } = string.Empty;
    public string? ClassId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Venue { get; set; }
    public decimal? MaxMarks { get; set; }
}
