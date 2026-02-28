namespace Studyzone.Domain.Entities;

public class MarksEntry
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public Guid StudentId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public decimal MarksObtained { get; set; }
    public decimal MaxMarks { get; set; }
    public DateTime CreatedAt { get; set; }
}
